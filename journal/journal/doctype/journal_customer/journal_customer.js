// Copyright (c) 2025, hamedshehab2001@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on('Journal Customer', {
    refresh(frm) {
        if (!frm.is_new()) {  // only show button after save
            frm.add_custom_button(__('Edit Customer'), function() {
                let d = new frappe.ui.Dialog({
                    title: 'Edit Customer',
                    fields: [
                        {
                            label: 'Phone Number',
                            fieldname: 'phone_number',
                            fieldtype: 'Data',
                            default: frm.doc.phone_number
                        },
                        {
                            label: 'Type',
                            fieldname: 'type',
                            fieldtype: 'Link',
                            options: 'Journal Customer Type',
                            default: frm.doc.type
                        }
                    ],
                    primary_action_label: 'Save',
                    primary_action(values) {
                        // Update the document fields
                        frm.set_value('phone_number', values.phone_number);
                        frm.set_value('type', values.type);

                        // Save the document
                        frm.save();

                        d.hide();
                    }
                });

                d.show();
            });
        }
        
        // Add button to create new transaction
        frm.add_custom_button(__('New Transaction'), function() {
            let d = new frappe.ui.Dialog({
                title: 'New Transaction',
                fields: [
                    { fieldname: 'units', label: 'Units', fieldtype: 'Int', non_negative: 1, reqd: 1 },
                    { fieldname: 'unit_price', label: 'Unit Price', fieldtype: 'Currency', non_negative: 1, reqd: 1 },
                    { fieldname: 'currency', label: 'Currency', fieldtype: 'Select', options: ['YER','SAR','USD'], default: 'YER', reqd: 1 },
                    { fieldname: 'type', label: 'Type', fieldtype: 'Select', options: ['Debit','Credit'], reqd: 1 },
                    { fieldname: 'details', label: 'Details', fieldtype: 'Small Text' }
                ],
                primary_action_label: 'Save & Submit',
                primary_action(values) {
                    create_transaction(values, 1); // submit
                    d.hide();
                }
            });

            d.set_secondary_action_label('Save as Draft');
            d.set_secondary_action(() => {
                let values = d.get_values();
                if (values) {
                    create_transaction(values, 0); // draft
                    d.hide();
                }
            });

            function create_transaction(values, docstatus) {
                const balance_field_map = {
                    "YER": "yemeni_balance",
                    "SAR": "saudi_balance",
                    "USD": "usd_balance"
                };
                let balance_fieldname = balance_field_map[values.currency];
                let old_balance = frm.doc[balance_fieldname];

                frappe.call({
                    method: "frappe.client.insert",
                    args: {
                        doc: {
                            doctype: "Journal Transaction",
                            customer: frm.doc.name,
                            units: values.units,
                            unit_price: values.unit_price,
                            currency: values.currency,
                            type: values.type,
                            details: values.details,
                            amount: values.units * values.unit_price,
                            old_balance: old_balance,
                            docstatus: docstatus
                        }
                    },
                    callback: function() {
                        frm.reload_doc();
                        frappe.show_alert({
                            message: docstatus ? __('Transaction Saved & Submitted') : __('Transaction Saved as Draft'),
                            indicator: docstatus ? 'green' : 'orange'
                        });
                    }
                });
            }

            d.show();
        });

        // Render dashboard on refresh
        if(!frm.doc.__islocal){
            make_dashboard(frm);
        }
    }
});

function make_dashboard(frm) {
    $("div").remove(".form-dashboard-section.custom");

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Journal Transaction",
            filters: { customer: frm.doc.name },
            fields: ["name","units","unit_price","currency","type","amount","old_balance","new_balance","docstatus","modified"],
            order_by: "modified desc",
            limit_page_length: 5
        },
        callback: function(r) {
            let transactions = r.message || [];
            if (transactions.length === 0) {
                return;
            }
            let html = frappe.render_template("journal_customer_dashboard", { 
                transactions: transactions,
                balances: frm.doc.customer_balances || [],
                customer: frm.doc.name
            });

            frm.dashboard.add_section(html, __("Recent Transactions"));
            frm.dashboard.show();
        }
    });
}
