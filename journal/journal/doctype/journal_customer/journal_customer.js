// Copyright (c) 2025, hamedshehab2001@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on("Journal Customer", {
	refresh(frm) {
		// if (!frm.is_new()) { //there is a better way now, check notes
		//     frm.add_custom_button(__('Download Transactions PDF'), function() {
		//         let url = frappe.urllib.get_full_url(
		//             `/api/method/journal.journal.doctype.journal_customer.journal_customer.download_transactions_pdf?customer=${frm.doc.name}`
		//         );
		//         window.open(url);
		//     });
		// }
		// d.$wrapper.find(".download-pdf-btn").on("click", function () {
		// 	let values = d.get_values() || {};

		// 	let params = {
		// 		customer: frm.doc.name,

		// 		from_date: values.from_date,

		// 		to_date: values.to_date,

		// 		type: values.type,

		// 		currency: values.currency,
		// 	};

		// 	// Remove empty params

		// 	Object.keys(params).forEach((key) => {
		// 		if (!params[key]) delete params[key];
		// 	});

		// 	let query = $.param(params);

		// 	let url = frappe.urllib.get_full_url(
		// 		`/api/method/journal.journal.doctype.journal_customer.journal_customer.download_transactions_pdf?${query}`
		// 	);

		// 	window.open(url);
		// });

		if (!frm.doc.__islocal) {
			render_journal_customer_filters(frm);
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

		if (!frm.is_new()) {
			// only show button after save
			frm.add_custom_button(__("Edit Customer"), function () {
				let d = new frappe.ui.Dialog({
					title: "Edit Customer",
					fields: [
						{
							label: "Phone Number",
							fieldname: "phone_number",
							fieldtype: "Data",
							default: frm.doc.phone_number,
						},
						{
							label: "Type",
							fieldname: "type",
							fieldtype: "Link",
							options: "Journal Customer Type",
							default: frm.doc.type,
						},
					],
					primary_action_label: "Save",
					primary_action(values) {
						// Update the document fields
						frm.set_value("phone_number", values.phone_number);
						frm.set_value("type", values.type);

						// Save the document
						frm.save();

						d.hide();
					},
				});

				d.show();
			});
		}

		// Add button to create new transaction
		frm.add_custom_button(__("New Transaction"), function () {
			let d = new frappe.ui.Dialog({
				title: "New Transaction",
				fields: [
					{
						fieldname: "units",
						label: "Units",
						fieldtype: "Int",
						non_negative: 1,
						reqd: 1,
					},
					{
						fieldname: "unit_price",
						label: "Unit Price",
						fieldtype: "Currency",
						non_negative: 1,
						reqd: 1,
					},
					{
						fieldname: "currency",
						label: "Currency",
						fieldtype: "Select",
						options: ["YER", "SAR", "USD"],
						default: window.last_currency || "YER",
						reqd: 1,
					},
					{
						fieldname: "type",
						label: "Type",
						fieldtype: "Select",
						options: ["Debit", "Credit"],
						reqd: 1,
					},
					{ fieldname: "datetime", label: "Date & Time", fieldtype: "Datetime" },
					{ fieldname: "details", label: "Details", fieldtype: "Small Text" },
				],
				primary_action_label: "Save & Submit",
				primary_action(values) {
					// If datetime is null or empty, set it to now
					if (!values.datetime) {
						values.datetime = frappe.datetime.now_datetime();
					}
					create_transaction(values, 1); // submit
					d.hide();
				},
			});

			d.set_secondary_action_label("Save as Draft");
			d.set_secondary_action(() => {
				let values = d.get_values();
				if (values) {
					create_transaction(values, 0); // draft
					d.hide();
				}
			});

			function create_transaction(values, docstatus) {
				const balance_field_map = {
					YER: "yemeni_balance",
					SAR: "saudi_balance",
					USD: "usd_balance",
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
							datetime: values.datetime || null,
						},
					},
					callback: function () {
						frm.reload_doc();
						frappe.show_alert({
							message: docstatus
								? __("Transaction Saved & Submitted")
								: __("Transaction Saved as Draft"),
							indicator: docstatus ? "green" : "orange",
						});
					},
				});
			}

			d.show();
		});

		// Render dashboard on refresh
		if (!frm.doc.__islocal) {
			make_dashboard(frm);
		}
		if (frm.is_new()) {
			frm.$wrapper.find(".form-dashboard-section.custom").remove();
			frm.$wrapper.find(".form-section.custom-filters-section").remove();

			return;
		}
	},
});

function make_dashboard(frm, filters = {}) {
	frappe.call({
			method: "journal.journal.doctype.journal_customer.journal_customer.get_grouped_journal_transactions",
			args: {
				journal_customer: frm.doc.name,
				from_date: filters.from_date || null,
				to_date: filters.to_date || null,
				tx_type: filters.type || null,
				currency: filters.currency || null
			},
			callback: function (r) {
				let data = r.message || {};
				let groups = data.groups || [];
				let balances = data.balances || [];

				// Render the dashboard using your replica microtemplate
				let html = frappe.render_template("journal_customer_dashboard2", {
					groups: groups,
					balances: balances,
					customer: frm.doc.name,
				});

				// Dynamically inject after the last form section
				let $form_sections = frm.$wrapper.find(".form-section");
				if ($form_sections.length) {
					let $last_section = $form_sections.last();
					// Remove previous custom dashboard sections
					$last_section.next(".form-dashboard-section.custom").remove();
					let $dashboard = $(`<div class="form-dashboard-section custom">${html}</div>`);
					$last_section.after($dashboard);
				} else {
					// Fallback: use frm.dashboard
					frm.dashboard.add_section(html, __("Recent Transactions"));
					frm.dashboard.show();
				}
			},
		});
}

function render_journal_customer_filters(frm) {
	// Store last used filter values in a global variable
	window.journal_customer_last_filters = window.journal_customer_last_filters || {};

	// Remove any previous filter section to avoid duplicates
	frm.$wrapper.find(".form-section.custom-filters-section").remove();

	// Add custom CSS for the clear (X) button and section layout
	if (!document.getElementById("journal-customer-clear-filters-style")) {
		const style = document.createElement("style");
		style.id = "journal-customer-clear-filters-style";
		style.innerHTML = `
			.form-section.custom-filters-section {
				margin-bottom: 16px;
				padding: 12px 18px;
				border-radius: 6px;
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 16px;
			}
			.journal-customer-filters-left,
			.journal-customer-filters-right {
				display: flex;
				align-items: center;
				gap: 12px;
			}
			.journal-customer-clear-filters-btn {
				font-weight: normal !important;
				opacity: 0.7;
				transition: background 0.15s, color 0.15s, opacity 0.15s;
				border-radius: 50%;
				padding: 2px 5px;
				margin-left: 6px;
				cursor: pointer;
				display: flex;
				align-items: center;
			}
			.journal-customer-clear-filters-btn:hover {
				background: #f0f0f0;
				color: #d9534f;
				opacity: 1;
			}
			.journal-customer-clear-filters-btn i {
				font-weight: normal !important;
				font-size: 13px;
			}
		`;
		document.head.appendChild(style);
	}

	// Create a new section for the filter and PDF buttons, spaced across the section
	const $filterSection = $(`
		<div class="form-section custom-filters-section">
			<div class="journal-customer-filters-left">
				<button class="btn btn-default filter-transactions-btn" style="display: flex; align-items: center; position: relative;">
					<i class="fa fa-filter" style="margin-right: 6px;"></i>
					${__("Filters")}
					<span class="journal-customer-clear-filters-btn" title="${__("Clear Filters")}">
						<i class="fa fa-times"></i>
					</span>
				</button>
			</div>
			<div class="journal-customer-filters-right">
				<button class="btn btn-primary download-pdf-btn">
					${__("Download PDF")}
				</button>
			</div>
		</div>
	`);
	// Inject after the last form section
	let $form_sections = frm.$wrapper.find(".form-section");
	if ($form_sections.length) {
		$form_sections.last().after($filterSection);
	} else {
		frm.$wrapper.prepend($filterSection);
	}

	$filterSection.find(".filter-transactions-btn").on("click", function (e) {
		// Prevent click if X was clicked
		if ($(e.target).closest(".journal-customer-clear-filters-btn").length) return;

		let last_filters = window.journal_customer_last_filters;

		// Helper to get date ranges
		function get_date_range(option) {
			const today = frappe.datetime.get_today();
			const now = frappe.datetime.now_date();
			let from_date = "",
				to_date = "";
			const date_obj = frappe.datetime.str_to_obj;

			if (option === "this_month") {
				const d = date_obj(now);
				from_date = frappe.datetime.obj_to_str(
					new Date(d.getFullYear(), d.getMonth(), 1)
				);
				to_date = frappe.datetime.obj_to_str(
					new Date(d.getFullYear(), d.getMonth() + 1, 0)
				);
			} else if (option === "last_month") {
				const d = date_obj(now);
				from_date = frappe.datetime.obj_to_str(
					new Date(d.getFullYear(), d.getMonth() - 1, 1)
				);
				to_date = frappe.datetime.obj_to_str(
					new Date(d.getFullYear(), d.getMonth(), 0)
				);
			}
			return { from_date, to_date };
		}

		let d = new frappe.ui.Dialog({
			title: __("Filter Transactions"),
			fields: [
				{
					label: "Quick Date Filter",
					fieldname: "quick_date",
					fieldtype: "Select",
					options: [
						"",
						{ label: "This Month", value: "this_month" },
						{ label: "Last Month", value: "last_month" },
					],
					onchange: function () {
						const val = d.get_value("quick_date");
						if (val) {
							const range = get_date_range(val);
							d.set_value("from_date", range.from_date);
							d.set_value("to_date", range.to_date);
						}
					},
				},
				{
					label: "From Date",
					fieldname: "from_date",
					fieldtype: "Date",
					default: last_filters.from_date || "",
				},
				{
					label: "To Date",
					fieldname: "to_date",
					fieldtype: "Date",
					default: last_filters.to_date || "",
				},
				{
					label: "Transaction Type",
					fieldname: "type",
					fieldtype: "Select",
					options: ["", "Debit", "Credit"],
					default: last_filters.type || "",
				},
				{
					label: "Currency",
					fieldname: "currency",
					fieldtype: "Link",
					options: "Currency",
					default: last_filters.currency || "",
				},
			],
			primary_action_label: __("Apply"),
			primary_action(values) {
				// Save filter values globally (ignore quick_date)
				let { quick_date, ...filters } = values;
				window.journal_customer_last_filters = Object.assign({}, filters);
				make_dashboard(frm, filters);
				d.hide(); // Close the dialog after applying filters
			},
		});

		// Set Clear Filters as secondary action
		d.set_secondary_action_label(__("Clear Filters"));
		d.set_secondary_action(() => {
			d.set_values({
				quick_date: "",
				from_date: "",
				to_date: "",
				type: "",
				currency: "",
			});
			window.journal_customer_last_filters = {};
			make_dashboard(frm, {});
			d.hide();
		});

		d.show();
	});

	$filterSection.find(".journal-customer-clear-filters-btn").on("click", function (e) {
		e.stopPropagation();
		window.journal_customer_last_filters = {};
		make_dashboard(frm, {});
	});

	$filterSection.find(".download-pdf-btn").on("click", function () {
		let url = frappe.urllib.get_full_url(
			`/api/method/journal.journal.doctype.journal_customer.journal_customer.download_transactions_pdf?customer=${frm.doc.name}`
		);
		window.open(url);
	});
}

// function make_dashboard(frm, filters = {}) {
	// frappe.msgprint("this worked")
	// Remove previous custom dashboard sections
	// frm.$wrapper.find(".form-dashboard-section.custom").remove();
	// // Declare last_currency as a global variable
	// window.last_currency = null;
	// // Build filters object
	// let transaction_filters = { customer: frm.doc.name };
	// if (filters.from_date && filters.to_date) {
	//     transaction_filters["datetime"] = ["between", [filters.from_date, filters.to_date]];
	// } else if (filters.from_date) {
	//     transaction_filters["datetime"] = [">=", filters.from_date];
	// } else if (filters.to_date) {
	//     transaction_filters["datetime"] = ["<=", filters.to_date];
	// }
	// if (filters.type) {
	//     transaction_filters["type"] = filters.type;
	// }
	// if (filters.currency) {
	//     transaction_filters["currency"] = filters.currency;
	// }
	// // Ensure page_size is > 1
	// let page_size = parseInt(filters.page_size, 10) || 20;
	// if (page_size < 1) page_size = 1;
	// frappe.call({
	//     method: "frappe.client.get_list",
	//     args: {
	//         doctype: "Journal Transaction",
	//         filters: transaction_filters,
	//         fields: ["name","units","unit_price","currency","type","amount","old_balance","new_balance","docstatus","modified","datetime"],
	//         order_by: "modified desc",
	//     },
	//     callback: function(r) {
	//         console.log(r)
	//         let transactions = r.message || [];
	//         // if (transactions.length === 0) {
	//         //     return;
	//         // }
	//         // Save the currency of the most recent transaction as a global variable
	//         if(transactions.length > 0){
	//             window.last_currency = transactions[0].currency;
	//         }
	//         let html = frappe.render_template("journal_customer_dashboard", {
	//             transactions: transactions,
	//             balances: frm.doc.customer_balances || [],
	//             customer: frm.doc.name
	//         });
	//         // Find the last section in the form and append the dashboard after it
	//         let $form_sections = frm.$wrapper.find('.form-section');
	//         if ($form_sections.length) {
	//             let $last_section = $form_sections.last();
	//             // Create a container for the dashboard
	//             let $dashboard = $(`<div class="form-dashboard-section custom">${html}</div>`);
	//             $last_section.after($dashboard);
	//         } else {
	//             // Fallback: add to dashboard as before
	//             frm.dashboard.add_section(html, __("Recent Transactions"));
	//             frm.dashboard.show();
	//         }
	//     }
	// });
// }