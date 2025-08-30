// Copyright (c) 2025, hamedshehab2001@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on("Journal Transaction", {
	refresh: function(frm) {
        if(frm.doc.customer && frm.doc.docstatus != 1) {
            load_customer_balances(frm);
        }
    },
    customer: function(frm) {
        if(frm.doc.docstatus != 1){    
            load_customer_balances(frm);
        }
    },
    currency: function(frm) {
        if(frm.doc.docstatus != 1){
            update_old_balance(frm)
            update_new_balance(frm)
            frm.set_value("currency_link", frm.doc.currency);
        }
    },
    amount: function(frm) {
        if(frm.doc.docstatus != 1){
            update_new_balance(frm)
        }
    },
    type: function(frm) {
        if(frm.doc.docstatus != 1){
            update_new_balance(frm)
        }
    },
    units(frm) {
        compute_amount(frm);
    },
    unit_price(frm) {
        compute_amount(frm);
    }
});

function compute_amount(frm) {
    let units = frm.doc.units || 0;
    let price = frm.doc.unit_price || 0;

    let total = units * price;

    frm.set_value("amount", total);

    // optional: update new_balance immediately
    if (frm.doc._balances && frm.doc.currency && frm.doc.transaction_type) {
        let old_bal = frm.doc._balances[frm.doc.currency] || 0;

        let new_bal = frm.doc.transaction_type === "Debit"
            ? old_bal + total
            : old_bal - total;

        frm.set_value("new_balance", new_bal);
    }
}


function load_customer_balances(frm) {
    // fetch once from DB
    frappe.db.get_value("Journal Customer", frm.doc.customer, 
        ["yemeni_balance", "saudi_balance", "usd_balance"]).then(r => {
        if (!r.message) return;

        frm.doc._balances = {
            YER: r.message.yemeni_balance,
            SAR: r.message.saudi_balance,
            USD: r.message.usd_balance
        };

        // immediately update balances if currency is selected
        update_old_balance(frm);
        update_new_balance(frm);
    });
}

function update_old_balance(frm) {
    if (frm.doc._balances && frm.doc.currency) {
        let bal = frm.doc._balances[frm.doc.currency] || 0;
        frm.set_value("old_balance", bal);
    }
}

function update_new_balance(frm) {
    if (!frm.doc.currency || !frm.doc.type || !frm.doc.amount) return;

    let old_bal = frm.doc._balances[frm.doc.currency] || 0;
    let amount = frm.doc.amount;

    let new_bal = frm.doc.type === "Debit" 
        ? old_bal + amount 
        : old_bal - amount;

    frm.set_value("new_balance", new_bal);
}