# Copyright (c) 2025, hamedshehab2001@gmail.com and contributors
# For license information, please see license.txt

from frappe.model.document import Document
import frappe
from frappe.utils.pdf import get_pdf
from frappe import _
import json

class JournalCustomer(Document):
	pass



@frappe.whitelist()
def download_transactions_pdf():
	# Get filters directly from query parameters
	filters = frappe._dict(frappe.form_dict)

	customer = filters.get("customer")
	if not customer:
		frappe.throw(_("Customer is required in filters."))

	# Remove non-filter keys if needed (e.g., 'cmd')
	filters.pop("cmd", None)

	# Fetch transactions using all filters (including customer)
	transactions = frappe.get_list(
		"Journal Transaction",
		filters=filters,
		fields=["name", "datetime", "amount", "type"]
	)

	if not transactions:
		frappe.throw(_("No transactions found for this customer."))

	# Render HTML template
	html = frappe.render_template(
		"journal/templates/includes/transactions_pdf.html",
		{"customer": customer, "transactions": transactions}
	)

	# Convert to PDF
	pdf_data = get_pdf(html)

	frappe.local.response.filename = f"Transactions_{customer}.pdf"
	frappe.local.response.filecontent = pdf_data
	frappe.local.response.type = "download"
