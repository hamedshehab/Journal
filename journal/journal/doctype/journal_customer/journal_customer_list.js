frappe.listview_settings['Journal Customer'] = {
    onload: function(listview) {
        if(listview.page.sidebar){
            listview.page.sidebar.remove();
            let sidebarToggle = listview.page.wrapper.find('.list-sidebar-toggle');
            if (sidebarToggle.length) {
                sidebarToggle.remove();
            }
        }
        listview.page.add_inner_button(__('New Transaction'), function() {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Journal Customer",
                    fields: ["name", "customer_name"],
                    limit_page_length: 100
                },
                callback: function(r) {
                    let d = new frappe.ui.Dialog({
                        title: 'New Transaction',
                        fields: [
                            {
                                fieldname: 'customer',
                                label: 'Customer',
                                fieldtype: 'Link',
                                options: 'Journal Customer',
                                reqd: 1
                            },
                            {fieldname: 'units', label: 'Units', fieldtype: 'Int', "non_negative": 1, reqd: 1},
                            {fieldname: 'unit_price', label: 'Unit Price', fieldtype: 'Currency', "non_negative": 1, reqd: 1},
                            {fieldname: 'currency', label: 'Currency', fieldtype: 'Select', options: ['YER','SAR','USD'], default: 'YER', reqd: 1},
                            {fieldname: 'type', label: 'Type', fieldtype: 'Select', options: ['Debit','Credit'], reqd: 1},
                            {fieldname: 'details', label: 'Details', fieldtype: 'Small Text'}
                        ],
                        primary_action_label: 'Save & Submit',
                        primary_action(values) {
                            create_transaction(values, 1);
                            d.hide();
                        }
                    });

                    d.set_secondary_action_label('Save as Draft');
                    d.set_secondary_action(() => {
                        let values = d.get_values();
                        if (values) {
                            create_transaction(values, 0);
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

                        frappe.call({
                            method: "frappe.client.get",
                            args: {
                                doctype: "Journal Customer",
                                name: values.customer
                            },
                            callback: function(res) {
                                let customer_doc = res.message;
                                let old_balance = customer_doc[balance_fieldname];

                                frappe.call({
                                    method: "frappe.client.insert",
                                    args: {
                                        doc: {
                                            doctype: "Journal Transaction",
                                            customer: values.customer,
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
                                        frappe.show_alert({
                                            message: docstatus ? __('Transaction Saved & Submitted') : __('Transaction Saved as Draft'),
                                            indicator: docstatus ? 'green' : 'orange'
                                        });
                                        listview.refresh();
                                    }
                                });
                            }
                        });
                    }

                    d.show();
                }
            });
        });
    }
};