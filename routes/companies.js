"use strict";

const express = require("express");

const db = require("../db");
const router = new express.Router();
const { BadRequestError, NotFoundError } = require("../expressError");


/** (Fixed) Search by user type.
 *  Returns {users: [user, user, user] }
 *  Where user = {id, name, type}
 */

router.get("/companies",
async function (req, res, next) {
  const type = req.query.type;

  const results = await db.query(
    `SELECT code, name,
             FROM companies,
             WHERE type = $1`, [type]);
  const companies = results.rows;
  return res.json({ companies });
});


module.exports = router;