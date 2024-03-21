const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
  let cResult = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('appleinc', 'Apple Inc', 'test')
    RETURNING code, name, description`);
  testCompany = cResult.rows[0];
  let iResult = await db.query(`
    INSERT INTO invoices (id, comp_code, amt, paid, add_date, paid_date)
    VALUES ('1', 'appleinc', '100', false, '2024-03-21T05:00:00.000Z', null)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoice = iResult.rows[0];
});

/** GET /companies - returns `{companies: [{code, name}, ...]}` */

describe("GET /companies", function () {
  test("Gets all companies", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [{ code: testCompany.code, name: testCompany.name }],
    });
    expect(resp.statusCode).toEqual(200);
  });
});

/** GET /company/[code] -
 * return data about one company: `{code, name, description, invoices: [id, ...]}` */

describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/appleinc`);
    expect(resp.body).toEqual({
      company: {
        code: "appleinc",
        name: "Apple Inc",
        description: "test",
        invoices: [1]
      }
    });
    expect(resp.statusCode).toEqual(200);
  });

  test("404 if not found", async function () {
    const resp = await request(app).get(`/companies/2000`);
    expect(resp.statusCode).toEqual(404);
  });
});


/** POST /companies - create & return `{company}` */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send({
        name: "New Company",
        description: "test description, please ignore"
      });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: {
        code: "newcompany",
        name: "New Company",
        description: "test description, please ignore"
      },
    });

    // test db
    const result = await db.query(
      `SELECT *
        FROM companies
        WHERE name = 'New Company'`);
    expect(result.rows.length).toEqual(1);
  });

  test("Empty Body POST", async function() {
    const resp = await request(app).post(`/companies`);
    expect(resp.statusCode).toEqual(400);
  });
});