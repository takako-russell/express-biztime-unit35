const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, com_code
            FROM invoices
            ORDER BY id `
    );
    return res.json({ invoices: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    const result = await db.quuery(
      `SELECT i.id, i.com_code,i.amt,i.paid,i.add_date,i.paid_date,c.name,c.description
             FROM invoices AS i
             INNER JOIN companies AS c ON (i.com_code = c.code)
             WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice:${id} does not exit`, 404);
    }

    const data = result.rows[0];

    const invoice = {
      id: data.id,
      company: {
        code: data.com_code,
        name: data.name,
        description: data.description,
      },
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
    };
    return res.json({ invoice: invoice });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    let { com_code, amt } = req.body;

    const result = await db.query(
      `INSERT INTO invoices (com_code, amt)
            VALUES ($1,$2)
            RETURNING id,com_code,amt,paid,add_date,paid_date`,
      [com_code, amt]
    );

    return res.json({ invoce: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    let { amt, paid } = req.body;
    let id = req.params.id;
    let paidDate = null;

    const result = await db.query(
      `SELECT paid
            FROM invoices
            WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`invoice ${id} does not exist`, 404);
    }

    let currPaid_date = result.rows[0].paid_date;

    if (!paid && currPaid_date) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaid_date;
    }

    const updateResult = db.query(
      `UPDATE invoices
            SET amt = $1, paid=$2, paid_date = $3
            WHERE id = $4
            RETURNING id,amt,paid,paid_date,add_date,paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoices: updateResult.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    const invoice = await db.query(
      `DELETE FROM invoices
            WHERE id = $1
            RETURNING id`,
      [id]
    );

    if (invoice.rows[0].length === 0) {
      throw new ExpressError(`invoice ${id} does not exit, 404`);
    }

    return res.json({
      status: "deleted",
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
