def execute():
	import frappe

	from healthcare.healthcare.rwanda_opd import (
		backfill_oriented_department_on_encounters,
		install_rwanda_opd,
		normalize_legacy_visit_statuses,
	)

	install_rwanda_opd()
	backfill_oriented_department_on_encounters()
	normalize_legacy_visit_statuses()
	frappe.clear_cache()
