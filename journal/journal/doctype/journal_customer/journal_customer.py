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
		fields=["name","title", "datetime", "amount", "type"]
	)

	if not transactions:
		frappe.throw(_("No transactions found for this customer."))

	# Prepare filters for template (exclude 'customer')
	template_filters = {k: v for k, v in filters.items() if k != "customer"}

	# Render HTML template
	html = frappe.render_template(
    	"journal/templates/includes/transactions_pdf.html",
    	{
        	"customer": customer,
        	"transactions": transactions,
        	"filters": template_filters
    	}
	)

	# Convert to PDF
	pdf_data = get_pdf(html)

	frappe.local.response.filename = f"Transactions_{customer}.pdf"
	frappe.local.response.filecontent = pdf_data
	frappe.local.response.type = "download"



import frappe
from frappe import _


@frappe.whitelist()
def get_grouped_journal_transactions(journal_customer, from_date=None, to_date=None, tx_type=None, currency=None):
    """
    Returns journal transactions for a journal customer,
    grouped by currency with totals, sorted by datetime descending.
    Also fetches balances from the child table in Journal Customer.
    """
    # Build filters for Journal Transaction
    filters = {"customer": journal_customer, "docstatus": ["!=", 2]}  # 'customer' field links to Journal Customer doctype

    if from_date and to_date:
        filters["datetime"] = ["between", [from_date, to_date]]
    elif from_date:
        filters["datetime"] = [">=", from_date]
    elif to_date:
        filters["datetime"] = ["<=", to_date]

    if tx_type:
        filters["type"] = tx_type
    if currency:
        filters["currency"] = currency

    # Fetch transactions
    transactions = frappe.get_all(
        "Journal Transaction",
        filters=filters,
        fields=[
            "name",
            "units",
            "unit_price",
            "currency",
            "type",
            "amount",
            "old_balance",
            "new_balance",
            "docstatus",
            "modified",
            "datetime"
        ],
        order_by="datetime desc"
    )

    # Group transactions by currency and compute totals
    grouped = {}
    for tx in transactions:
        curr = tx["currency"]

        if curr not in grouped:
            grouped[curr] = {
                "currency": curr,
                "transactions": [],
                "totals": {"debit": 0, "credit": 0, "balance": 0}
            }

        # Add transaction
        grouped[curr]["transactions"].append(tx)

        # Update totals
        if tx["docstatus"] == 1:
            if tx["type"] == "Debit":
                grouped[curr]["totals"]["debit"] += tx.get("amount") or 0
                grouped[curr]["totals"]["balance"] -= tx.get("amount") or 0
            else:  # Credit
                grouped[curr]["totals"]["credit"] += tx.get("amount") or 0
                grouped[curr]["totals"]["balance"] += tx.get("amount") or 0

    # Convert dict to list (preserves insertion order in Python 3.7+)
    result = list(grouped.values())

    # Fetch balances from the child table of Journal Customer
    journal_customer_doc = frappe.get_doc("Journal Customer", journal_customer)
    balances = getattr(journal_customer_doc, "customer_balances", [])

    # Prepare filters for UI (only return those that are not None)
    applied_filters = {}
    if from_date:
        applied_filters["from_date"] = from_date
    if to_date:
        applied_filters["to_date"] = to_date
    if tx_type:
        applied_filters["type"] = tx_type
    if currency:
        applied_filters["currency"] = currency

    # Recent transactions only if filters applied
    recent_transactions = []
    if applied_filters:  # <-- check if dict has anything
        recent_transactions = frappe.get_all(
            "Journal Transaction",
            filters={"customer": journal_customer, "docstatus": ["!=", 2]},
            fields=[
                "name","units","unit_price","currency","type",
                "amount","old_balance","new_balance",
                "docstatus","modified","datetime"
            ],
            order_by="datetime desc",
            limit=5
        )

    return {"groups": result, "balances": balances, "filters": applied_filters, "recent_transactions": recent_transactions}


@frappe.whitelist()
def get_recent_transactions(journal_customer, limit=20):
    """
    Optional helper: fetch recent transactions for a journal customer (without grouping).
    """
    transactions = frappe.get_all(
        "Journal Transaction",
        filters={"customer": journal_customer},
        fields=[
            "name",
            "units",
            "unit_price",
            "currency",
            "type",
            "amount",
            "old_balance",
            "new_balance",
            "docstatus",
            "modified",
            "datetime"
        ],
        order_by="datetime desc",
        limit_page_length=limit
    )

    journal_customer_doc = frappe.get_doc("Journal Customer", journal_customer)
    balances = getattr(journal_customer_doc, "customer_balances", [])

    return {"transactions": transactions, "balances": balances}
