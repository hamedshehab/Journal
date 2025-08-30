# Copyright (c) 2025, hamedshehab2001@gmail.com and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class JournalTransaction(Document):
	def validate(self):
		prefix = ""
		if self.get("type") == "Debit":
			prefix = "DEB-"
		elif self.get("type") == "Credit":
			prefix = "CRED-"
		else:
			prefix = ""

		customer_name = self.customer or ""
		date_str = ""
		if self.get("datetime"):
			try:
				# Parse string to datetime if necessary
				if isinstance(self.datetime, str):
					from frappe.utils import get_datetime

					dt = get_datetime(self.datetime)
				else:
					dt = self.datetime
				date_str = dt.strftime("%y-%m-%d")
			except Exception:
				date_str = now_datetime().strftime("%y-%m-%d")
		else:
			date_str = now_datetime().strftime("%y-%m-%d")

		# Get the latest transaction index for this customer and increment it only if not already set
		if not self.idx:
			auto_increment = 1
			if self.customer:
				latest = frappe.db.get_value("Journal Transaction", {"customer": self.customer}, "MAX(idx)")
				if latest:
					auto_increment = int(latest) + 1
			self.idx = auto_increment
		else:
			auto_increment = self.idx

		self.title = f"{prefix}{date_str}-{customer_name}-{auto_increment}"

	def before_save(self):
		if not self.get("datetime"):
			self.datetime = now_datetime()

	def on_submit(self):
		if self.currency in ["YER", "SAR", "USD"]:
			customer = frappe.get_doc("Journal Customer", self.customer)
			amount = self.amount or 0
			if self.get("type") == "Credit":
				amount = -amount
			# Update customer balance
			if self.currency == "YER":
				customer.yemeni_balance = (customer.yemeni_balance or 0) + amount
				self.new_balance = customer.yemeni_balance
			elif self.currency == "SAR":
				customer.saudi_balance = (customer.saudi_balance or 0) + amount
				self.new_balance = customer.saudi_balance
			elif self.currency == "USD":
				customer.usd_balance = (customer.usd_balance or 0) + amount
				self.new_balance = customer.usd_balance
			customer.save(ignore_permissions=True)
			# Persist new_balance in the transaction itself
			self.db_set("new_balance", self.new_balance, update_modified=False)
