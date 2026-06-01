def execute():
	import frappe

	from healthcare.healthcare.rwanda_consultation import install_rwanda_consultation

	install_rwanda_consultation()
	frappe.clear_cache()
