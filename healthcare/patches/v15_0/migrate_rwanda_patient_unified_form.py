def execute():
	"""Re-apply Rwanda Patient form (unified layout, insurance dropdown, cleanup child table)."""
	from healthcare.healthcare.rwanda_registration import install_rwanda_patient_registration

	install_rwanda_patient_registration()
