"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();
const { BadRequestError, NotFoundError } = require("../expressError");


/** Gets companies
 *  Returns JSON {companies: [{code, name}, ...]}
 *  Where company = {code, name, description}
 */

router.get("/",
async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
             FROM companies`);

  const companies = results.rows;
  return res.json({ companies });
});


/** Search by company code.
 *  Returns JSON {company: {code, name, description}}
 *  Where company = {code, name, description}
 */

router.get("/:code",
async function (req, res, next) {
  const code = req.params.code

  const cResults = await db.query(
    `SELECT code, name, description
             FROM companies
             WHERE code = $1`, [code]);

  const company = cResults.rows[0];

  if(!company) {
    throw new NotFoundError("Company does not exist.")
  }

  const iResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
             FROM invoices
             WHERE comp_code = $1`, [code]);

  const invoices = iResults.rows;

  company.invoices = invoices.map(r => r.id);


  return res.json({ company });
});


/** Create new company,
 * input requires JSON { "name": name, "description": description }
 * returning JSON {company: {code, name, description}}
*/

router.post("/", async function (req, res, next) {
  console.log ("*** POST / req.body:", req.body);
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;
  const result = await db.query(
    `INSERT INTO companies (code, name, description)
           VALUES ($1, $2, $3)
           RETURNING code, name, description`,
    [code, name, description],
  );

  const company = result.rows[0];
  return res.status(201).json({ company });
});


/** Update company,
 * input requires JSON { "name": name, "description": description }
 * returning JSON {company: {code, name, description}}
*/

router.put("/:code", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
           SET name=$1,
               description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, req.params.code],
    // RETURNING lets me use it later
  );

  const company = result.rows[0];

  if(!company) {
    throw new NotFoundError("Company does not exist.")
  }

  return res.json({ company });
});

/** Delete company, returning {status: "Deleted"} */

router.delete("/:code", async function (req, res, next) {
  const result = await db.query(
    `DELETE FROM companies WHERE code = $1
    RETURNING code`,
    [req.params.code],
  );
  const company = result.rows[0];
  if(!company) {
    throw new NotFoundError("Company does not exist.")
  }

  return res.json({ status: "deleted" });
});


module.exports = router;