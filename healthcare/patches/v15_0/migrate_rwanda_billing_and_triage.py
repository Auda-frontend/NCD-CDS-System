def execute():
	from healthcare.healthcare.rwanda_registration import (
		apply_triage_labels,
		hide_patient_customer_details_on_form,
	)

	hide_patient_customer_details_on_form()
	apply_triage_labels()
