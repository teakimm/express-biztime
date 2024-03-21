"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();
const { BadRequestError, NotFoundError } = require("../expressError");

/** Gets invoices
 *  Returns JSON {invoices: [{id, comp_code}, ...]}
 *  Where invoice = {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.get("/",
async function (req, res, next) {
  const results = await db.query( //TODO: order by id
    `SELECT id, comp_code
             FROM invoices`);

  const invoices = results.rows;
  return res.json({ invoices });
});

/** Search by invoice id.
 *  Returns JSON
 * {invoice: {id, amt, paid, add_date, paid_date, company:
 *    {code, name, description}
 * }
 */
router.get("/:id", //TODO: try in one query using a join
async function (req, res, next) {
  const id = req.params.id

  const iResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
             FROM invoices
             WHERE id = $1`, [id]);

  const invoice = iResults.rows[0];

  if(!invoice) {
    throw new NotFoundError("invoice does not exist.")
  }

  const mResult = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [invoice.comp_code]
  )

  invoice.company = mResult.rows;

  return res.json({ invoice });
});


/** Create new invoice,
 * input requires JSON { "comp_code": comp_code, "amt": amt }
 * returning JSON { invoice: {id, comp_code, amt, paid, add_date, paid_date }}
*/

router.post("/", async function (req, res, next) {
  console.log ("*** POST / req.body:", req.body);
  if (!req.body) throw new BadRequestError();

  const { comp_code, amt } = req.body;

  const cResults = await db.query(
    `SELECT code
            FROM companies
            WHERE code = $1`, [comp_code]
  )
  const company = cResults.rows[0];

  if(!company) {
    throw new NotFoundError("Company code does not exist")
  }

  const iResults = await db.query(
    `INSERT INTO invoices (comp_code, amt)
           VALUES ($1, $2)
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt],
  );

  const invoice = iResults.rows[0];
  return res.status(201).json({ invoice });
});


/** Update invoice,
 * input requires JSON { "amt": amt }
 * returning JSON {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/

router.put("/:id", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const { amt } = req.body;

  const result = await db.query(
    `UPDATE invoices
           SET amt=$1
           WHERE id = $2
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, req.params.id],
  );

  const invoice = result.rows[0];

  if(!invoice) {
    throw new NotFoundError("Invoice does not exist.")
  }

  return res.json({ invoice });
});


/** Delete invoice, returning {status: "Deleted"} */

router.delete("/:id", async function (req, res, next) {
  const result = await db.query(
    `DELETE FROM invoices WHERE id = $1
    RETURNING id`,
    [req.params.id],
  );

  const invoice = result.rows[0];

  if(!invoice) {
    throw new NotFoundError("invoice does not exist.")
  }

  return res.json({ status: "deleted" });
});


module.exports = router;