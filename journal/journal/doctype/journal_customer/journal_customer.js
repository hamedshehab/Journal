// Copyright (c) 2025, hamedshehab2001@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on('Journal Customer', {
    refresh(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button(__('Download Transactions PDF'), function() {
                let url = frappe.urllib.get_full_url(
                    `/api/method/journal.journal.doctype.journal_customer.journal_customer.download_transactions_pdf?customer=${frm.doc.name}`
                );
                window.open(url);
            });
        }

        if(!frm.doc.__islocal){
            // Function to insert the custom filters when the dashboard section is available
            function insertCustomFilters() {
                // Create or find a dedicated section for filters above the dashboard
                let $filters_section = frm.$wrapper.find('.form-section.custom-filters-section');
                if ($filters_section.length === 0) {
                $filters_section = $('<div class="form-section custom-filters-section" style="padding: 16px 20px;"></div>');
                // Insert filters section after the last form section
                let $last_section = frm.$wrapper.find('.form-section').last();
                $last_section.after($filters_section);
                }
                // Only add filters if not already present
                if ($filters_section.find('.custom-filters').length === 0) {
                // Add a label above the filters
                $filters_section.append('<div style="font-weight: 600; margin-bottom: 8px;">Transaction Filters</div>');

                let $wrapper = $('<div class="custom-filters" style="margin-bottom:10px; display: flex; gap: 10px; align-items: flex-end;"></div>');
                $filters_section.append($wrapper);

                // Common style for equal width and expansion
                const inputStyle = "flex:1; min-width:0;";

                // From Date
                let from_date_control = frappe.ui.form.make_control({
                    parent: $wrapper,
                    df: {
                    label: 'From Date',
                    fieldname: 'from_date',
                    fieldtype: 'Date',
                    onchange: () => {
                                        console.log (frm._suppress_filter_onchange)

                        if (frm._suppress_filter_onchange) return;
                        if(frm._from_date && frm._from_date == from_date_control.get_value()) return;
                        make_dashboard(frm, {
                        from_date: from_date_control.get_value(),
                        to_date: to_date_control.get_value(),
                        type: type_control.get_value(),
                        page_size: page_size_control.get_value()
                        });
                        frm._from_date = from_date_control.get_value();
                    },
                    },
                    render_input: true
                });
                from_date_control.make_input();
                $(from_date_control.$wrapper).css("flex", "1").css("min-width", "0");

                // To Date
                let to_date_control = frappe.ui.form.make_control({
                    parent: $wrapper,
                    df: {
                    label: 'To Date',
                    fieldname: 'to_date',
                    fieldtype: 'Date',
                    onchange: () => {
                                        console.log (frm._suppress_filter_onchange)

                        if (frm._suppress_filter_onchange) return;
                        if(frm._to_date && frm._to_date == to_date_control.get_value()) return;
                        make_dashboard(frm, {
                        from_date: from_date_control.get_value(),
                        to_date: to_date_control.get_value(),
                        type: type_control.get_value(),
                        page_size: page_size_control.get_value()
                        });
                        frm._to_date = to_date_control.get_value();
                    },
                    },
                    render_input: true,
                });
                to_date_control.make_input();
                $(to_date_control.$wrapper).css("flex", "1").css("min-width", "0");

                // Transaction Type
                let type_control = frappe.ui.form.make_control({
                    parent: $wrapper,
                    df: {
                    label: 'Transaction Type',
                    fieldname: 'type',
                    fieldtype: 'Select',
                    options: ['', 'Debit', 'Credit'],
                    onchange: () => {
                        if (frm._suppress_filter_onchange) return;
                        make_dashboard(frm, {
                        from_date: from_date_control.get_value(),
                        to_date: to_date_control.get_value(),
                        type: type_control.get_value(),
                        page_size: page_size_control.get_value()
                        });
                    },
                    },
                    render_input: true
                });
                type_control.make_input();
                $(type_control.$wrapper).css("flex", "1").css("min-width", "0");

                // Page Size field (small, next to filters)
                let page_size_control = frappe.ui.form.make_control({
                    parent: $wrapper,
                    df: {
                    label: 'Page Size',
                    fieldname: 'page_size',
                    fieldtype: 'Int',
                    default: window.last_page_size || 20,
                    placeholder: 20,
                    min: 1,
                    onchange: () => {
                        window.last_page_size = page_size_control.get_value();
                        if(frm._page_size && frm._page_size == page_size_control.get_value()) return;
                        make_dashboard(frm, {
                        from_date: from_date_control.get_value(),
                        to_date: to_date_control.get_value(),
                        type: type_control.get_value(),
                        page_size: page_size_control.get_value()
                        });
                        frm._page_size = page_size_control.get_value();
                    }
                    },
                    render_input: true
                });
                page_size_control.make_input();
                // Make it small and aligned
                $(page_size_control.$wrapper).css({
                    "width": "70px",
                    "min-width": "70px",
                    "flex": "none"
                });

                // Bottom right controls: Clear Filters button and Download PDF button
                let $bottom_controls = $(`
                    <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 8px;">
                        <button type="button" class="btn btn-default btn-xs clear-filters-btn">${__('Clear Filters')}</button>
                        <button type="button" class="btn btn-primary btn-xs download-pdf-btn">${__('Download Transactions PDF')}</button>
                    </div>
                `);
                $filters_section.append($bottom_controls);

                // Download PDF button logic
                $bottom_controls.find('.download-pdf-btn').on('click', function() {
                    let params = {
                        customer: frm.doc.name,
                        from_date: from_date_control.get_value(),
                        to_date: to_date_control.get_value(),
                        type: type_control.get_value(),
                        page_size: page_size_control.get_value()
                    };
                    // Remove empty params
                    Object.keys(params).forEach(key => {
                        if (!params[key]) delete params[key];
                    });
                    let query = $.param(params);
                    let url = frappe.urllib.get_full_url(
                        `/api/method/journal.journal.doctype.journal_customer.journal_customer.download_transactions_pdf?${query}`
                    );
                    window.open(url);
                    console.log(params)
                });

                // Clear Filters button logic
                $bottom_controls.find('.clear-filters-btn').on('click', function() {
                    frm._suppress_filter_onchange = true;
                    console.log (frm._suppress_filter_onchange)
                    from_date_control.set_value('');
                    to_date_control.set_value('');
                    type_control.set_value('');
                    // Optionally reset page size to default
                    // page_size_control.set_value(20);
                    make_dashboard(frm, { page_size: page_size_control.get_value() });
                    setTimeout(() => { frm._suppress_filter_onchange = false; }, 500);
                });
                }
                return $filters_section.length > 0;
            }

            // Try immediately, then keep checking every 300ms for up to 3 seconds
            if (!insertCustomFilters()) {
                let interval = setInterval(() => {
                if (insertCustomFilters() ) {
                    clearInterval(interval);
                }
                }, 300);
            }
        }
        // frm.add_custom_button(__('Filter Transactions'), () => {
        //     let d = new frappe.ui.Dialog({
        //     title: 'Filter Transactions',
        //     fields: [
        //         { fieldname: 'from_date', label: 'From Date', fieldtype: 'Date' },
        //         { fieldname: 'to_date', label: 'To Date', fieldtype: 'Date' },
        //         { fieldname: 'type', label: 'Type', fieldtype: 'Select', options: ['','Debit','Credit'] }
        //     ],
        //     primary_action_label: 'Apply',
        //     primary_action(values) {
        //         make_dashboard(frm, values);
        //         d.hide();
        //     }
        //     });
        //     d.show();
        // });

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
                { fieldname: 'currency', label: 'Currency', fieldtype: 'Select', options: ['YER','SAR','USD'], default: window.last_currency || 'YER', reqd: 1 },
                { fieldname: 'type', label: 'Type', fieldtype: 'Select', options: ['Debit','Credit'], reqd: 1 },
                { fieldname: 'datetime', label: 'Date & Time', fieldtype: 'Datetime' },
                { fieldname: 'details', label: 'Details', fieldtype: 'Small Text' }
            ],
            primary_action_label: 'Save & Submit',
            primary_action(values) {
                // If datetime is null or empty, set it to now
                if (!values.datetime) {
                    values.datetime = frappe.datetime.now_datetime();
                }
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
                    docstatus: docstatus,
                    datetime: values.datetime || null
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
        if (frm.is_new()) {
            frm.$wrapper.find(".form-dashboard-section.custom").remove();
            frm.$wrapper.find('.form-section.custom-filters-section').remove();

            return;
        }
    }
});

function make_dashboard(frm, filters = {}) {
    // Remove previous custom dashboard sections
    frm.$wrapper.find(".form-dashboard-section.custom").remove();

    // Declare last_currency as a global variable
    window.last_currency = null;

    // Build filters object
    let transaction_filters = { customer: frm.doc.name };
    if (filters.from_date && filters.to_date) {
        transaction_filters["datetime"] = ["between", [filters.from_date, filters.to_date]];
    } else if (filters.from_date) {
        transaction_filters["datetime"] = [">=", filters.from_date];
    } else if (filters.to_date) {
        transaction_filters["datetime"] = ["<=", filters.to_date];
    }
    if (filters.type) {
        transaction_filters["type"] = filters.type;
    }

    // Ensure page_size is > 1
    let page_size = parseInt(filters.page_size, 10) || 20;
    if (page_size < 1) page_size = 1;

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Journal Transaction",
            filters: transaction_filters,
            fields: ["name","units","unit_price","currency","type","amount","old_balance","new_balance","docstatus","modified","datetime"],
            order_by: "modified desc",
            limit_page_length: page_size
        },
        callback: function(r) {
            console.log(r)
            let transactions = r.message || [];
            // if (transactions.length === 0) {
            //     return;
            // }
            // Save the currency of the most recent transaction as a global variable
            if(transactions.length > 0){
                window.last_currency = transactions[0].currency;
            }
            let html = frappe.render_template("journal_customer_dashboard", { 
                transactions: transactions,
                balances: frm.doc.customer_balances || [],
                customer: frm.doc.name
            });

            // Find the last section in the form and append the dashboard after it
            let $form_sections = frm.$wrapper.find('.form-section');
            if ($form_sections.length) {
                let $last_section = $form_sections.last();
                // Create a container for the dashboard
                let $dashboard = $(`<div class="form-dashboard-section custom">${html}</div>`);
                $last_section.after($dashboard);
            } else {
                // Fallback: add to dashboard as before
                frm.dashboard.add_section(html, __("Recent Transactions"));
                frm.dashboard.show();
            }
        }
    });
}
