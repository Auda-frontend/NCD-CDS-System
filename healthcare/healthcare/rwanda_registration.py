# -*- coding: utf-8 -*-
# Rwanda national registration: patient identifiers, residence, insurance (single form flow).
# Integrated into the healthcare app (no separate bench app).

import frappe
from frappe import _
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields
from frappe.utils import cint

RWANDA_MPI_ROLES = ("System Manager", "Rwanda MPI Admin")

# Legacy custom fields / table from earlier iteration — removed on install.
OBSOLETE_PATIENT_CUSTOM_FIELDS = (
	"rw_registration_sb",
	"rw_col_reg_1",
	"rw_col_reg_2",
	"rw_insurance_section",
	"rw_insurance_coverage",
)


def install_rwanda_patient_registration():
	"""Idempotent: strip legacy layout, apply unified fields on Patient, MPI role."""
	remove_obsolete_rwanda_patient_fields()
	remove_patient_insurance_coverage_doctype_if_unused()
	create_custom_fields(get_rwanda_patient_custom_fields(), update=True)
	hide_patient_customer_details_on_form()
	apply_patient_registration_labels()
	apply_triage_labels()
	ensure_rwanda_mpi_role()
	extend_patient_quick_search_fields()
	extend_patient_list_filters()
	frappe.clear_cache()


def install_rwanda_phase_a_registration():
	"""Re-apply Phase A registration fields and desk metadata (safe on existing sites)."""
	install_rwanda_patient_registration()


def remove_obsolete_rwanda_patient_fields():
	for row in frappe.get_all(
		"Custom Field",
		filters={"dt": "Patient", "fieldname": ["in", list(OBSOLETE_PATIENT_CUSTOM_FIELDS)]},
		pluck="name",
	):
		try:
			frappe.delete_doc("Custom Field", row, force=1, ignore_permissions=True)
		except Exception:
			frappe.db.delete("Custom Field", {"name": row})
	frappe.db.commit()


def remove_patient_insurance_coverage_doctype_if_unused():
	"""Drop child DocType/table from the old multi-row insurance design."""
	if not frappe.db.exists("DocType", "Patient Insurance Coverage"):
		return
	try:
		frappe.delete_doc("DocType", "Patient Insurance Coverage", force=1, ignore_permissions=True)
	except Exception:
		pass
	frappe.db.commit()


# Shown on Sales Invoice / billing — hidden on Patient registration.
PATIENT_CUSTOMER_AND_BILLING_DEFAULT_FIELDS = (
	"customer_details_section",
	"customer",
	"customer_group",
	"territory",
	"column_break_24",
	"default_currency",
	"default_price_list",
	"language",
)


def hide_patient_customer_details_on_form():
	"""Route party & price defaults to billing (Sales Invoice), not Patient form."""
	for fieldname in PATIENT_CUSTOMER_AND_BILLING_DEFAULT_FIELDS:
		set_patient_field_hidden(fieldname, hidden=1)


def set_patient_field_hidden(fieldname, hidden=1):
	"""Property Setter on core Patient fields (idempotent)."""
	val = "1" if hidden else "0"
	name = frappe.db.get_value(
		"Property Setter",
		{
			"doc_type": "Patient",
			"field_name": fieldname,
			"property": "hidden",
		},
		"name",
	)
	if name:
		frappe.db.set_value("Property Setter", name, "value", val)
		return
	frappe.make_property_setter(
		{
			"doctype": "Property Setter",
			"doctype_or_field": "DocField",
			"doc_type": "Patient",
			"field_name": fieldname,
			"property": "hidden",
			"property_type": "Check",
			"value": val,
		},
		validate_fields_for_doctype=False,
	)


def apply_patient_registration_labels():
	"""Desk labels aligned with Rwanda registration workflow."""
	set_patient_field_property("uid", "label", "Identification Number (UID / NIN / Passport)")
	set_patient_field_property("sb_relation", "label", "Next of kin & guardians")


def set_patient_field_property(fieldname, property_name, value):
	name = frappe.db.get_value(
		"Property Setter",
		{"doc_type": "Patient", "field_name": fieldname, "property": property_name},
		"name",
	)
	if name:
		frappe.db.set_value("Property Setter", name, "value", value)
		return
	frappe.make_property_setter(
		{
			"doctype": "Property Setter",
			"doctype_or_field": "DocField",
			"doc_type": "Patient",
			"field_name": fieldname,
			"property": property_name,
			"property_type": "Data",
			"value": value,
		},
		validate_fields_for_doctype=False,
	)


def extend_patient_list_filters():
	"""Promote Rwanda identifiers in list view filters."""
	for fieldname in (
		"rw_national_id",
		"rw_upid",
		"rw_insurance_member_number",
		"rw_patient_insured",
		"rw_insurance_type",
	):
		frappe.db.set_value(
			"Custom Field",
			{"dt": "Patient", "fieldname": fieldname},
			"in_standard_filter",
			1,
		)


def apply_triage_labels():
	"""__('Vital Signs') and similar resolve to Triage in the default language."""
	ensure_translation_vital_signs_to_triage()


def ensure_translation_vital_signs_to_triage():
	lang = frappe.db.get_single_value("System Settings", "language")
	if not lang or not frappe.db.exists("Language", lang):
		lang = frappe.db.get_value("Language", {}, "name") or "en"
	source = "Vital Signs"
	target = "Triage"
	names = frappe.get_all(
		"Translation",
		filters={"language": lang, "source_text": source},
		pluck="name",
		limit=1,
	)
	if names:
		frappe.db.set_value("Translation", names[0], "translated_text", target)
	else:
		frappe.get_doc(
			{
				"doctype": "Translation",
				"language": lang,
				"source_text": source,
				"translated_text": target,
			}
		).insert(ignore_permissions=True)


def ensure_rwanda_mpi_role():
	if frappe.db.exists("Role", {"role_name": "Rwanda MPI Admin"}):
		return
	frappe.get_doc(
		{
			"doctype": "Role",
			"role_name": "Rwanda MPI Admin",
			"desk_access": 1,
			"is_custom": 1,
		}
	).insert(ignore_permissions=True)


def extend_patient_quick_search_fields():
	"""Ensure NIN, UPID, and insurance member appear in Patient quick search."""
	meta = frappe.get_meta("Patient")
	parts = [p.strip() for p in (meta.search_fields or "").split(",") if p.strip()]
	before = len(parts)
	for fname in ("rw_national_id", "rw_upid", "rw_insurance_member_number"):
		if fname not in parts:
			parts.append(fname)
	if len(parts) == before:
		return
	new_val = ",".join(parts)
	ps_name = frappe.db.get_value(
		"Property Setter",
		{
			"doc_type": "Patient",
			"property": "search_fields",
			"doctype_or_field": "DocType",
		},
		"name",
	)
	if ps_name:
		ps = frappe.get_doc("Property Setter", ps_name)
		ps.value = new_val
		ps.save(ignore_permissions=True)
	else:
		frappe.make_property_setter(
			{
				"doctype": "Property Setter",
				"doc_type": "Patient",
				"doctype_or_field": "DocType",
				"property": "search_fields",
				"property_type": "Small Text",
				"value": new_val,
			},
			validate_fields_for_doctype=False,
		)


def get_rwanda_insurance_provider_options():
	return "\n".join(
		[
			"",
			"CBHI (Mutuelle de sante)",
			"CBHI (Mutuelle de sante) (INDIGENT) 100%",
			"CBHI (Mutuelle de sante) 100%",
			"CBHI (Mutuelle de sante) 90%",
			"EDEN CARE 100%",
			"EDEN CARE 85%",
			"RSSB (RAMA) 85%",
			"RSSB Mutuelle",
			"Private commercial",
			"Employer scheme",
			"Other",
		]
	)


def get_rwanda_patient_custom_fields():
	"""Unified patient registration form (eBuzima-aligned, no extra section titles)."""
	return {
		"Patient": [
			{
				"fieldname": "rw_reg_search_help",
				"fieldtype": "HTML",
				"label": "Registration",
				"insert_after": "uid",
				"options": (
					'<div class="text-muted small">'
					"Before saving, use <b>Find Existing Patient</b> (UPID, name, NIN, phone, insurance number)."
					"</div>"
				),
			},
			{
				"fieldname": "rw_identification_type",
				"fieldtype": "Select",
				"label": "Identification type",
				"options": "UNKNOWN\nNIDA / NIN\nPassport\nForeign ID\nRefugee ID",
				"default": "UNKNOWN",
				"insert_after": "rw_reg_search_help",
				"in_standard_filter": 1,
			},
			{
				"fieldname": "rw_national_id",
				"fieldtype": "Data",
				"label": "National ID (NIN)",
				"description": "National Identification Number — cannot be changed after save except by MPI administrators.",
				"insert_after": "rw_identification_type",
				"in_standard_filter": 1,
				"in_list_view": 1,
			},
			{
				"fieldname": "rw_upid",
				"fieldtype": "Data",
				"label": "UPID",
				"description": "Unique patient identifier (client registry / HIE)",
				"insert_after": "rw_national_id",
				"in_standard_filter": 1,
				"in_list_view": 1,
			},
			{
				"fieldname": "rw_upid_is_temporary",
				"fieldtype": "Check",
				"label": "Temporary UPID",
				"default": "0",
				"insert_after": "rw_upid",
			},
			{
				"fieldname": "rw_upid_source",
				"fieldtype": "Select",
				"label": "UPID source",
				"options": "HIE Client Registry\nLocal Temporary\nManual Assignment",
				"insert_after": "rw_upid_is_temporary",
			},
			{
				"fieldname": "rw_nationality",
				"fieldtype": "Select",
				"label": "Nationality",
				"options": "Rwanda\nOther",
				"default": "Rwanda",
				"insert_after": "rw_upid_source",
			},
			{
				"fieldname": "rw_tracnet_id",
				"fieldtype": "Data",
				"label": "TRACnet ID",
				"insert_after": "rw_nationality",
			},
			{
				"fieldname": "rw_col_addr",
				"fieldtype": "Column Break",
				"insert_after": "rw_tracnet_id",
			},
			{
				"fieldname": "rw_residence_province",
				"fieldtype": "Data",
				"label": "Residence province",
				"insert_after": "rw_col_addr",
			},
			{
				"fieldname": "rw_residence_district",
				"fieldtype": "Data",
				"label": "Residence district",
				"insert_after": "rw_residence_province",
			},
			{
				"fieldname": "rw_residence_sector",
				"fieldtype": "Data",
				"label": "Residence sector",
				"insert_after": "rw_residence_district",
			},
			{
				"fieldname": "rw_education_level",
				"fieldtype": "Select",
				"label": "Level of education",
				"options": "\nNone\nPrimary\nSecondary\nTVET\nUniversity\nOther",
				"insert_after": "marital_status",
			},
			{
				"fieldname": "rw_religion",
				"fieldtype": "Select",
				"label": "Religion",
				"options": "\nChristian\nMuslim\nOther\nPrefer not to say",
				"insert_after": "rw_education_level",
			},
			{
				"fieldname": "rw_patient_insured",
				"fieldtype": "Select",
				"label": "Patient insured?",
				"options": "No\nYes",
				"default": "No",
				"reqd": 1,
				"insert_after": "rw_religion",
				"in_standard_filter": 1,
			},
			{
				"fieldname": "rw_insurance_type",
				"fieldtype": "Select",
				"label": "Insurance provider",
				"options": get_rwanda_insurance_provider_options(),
				"depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"mandatory_depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"insert_after": "rw_patient_insured",
				"in_standard_filter": 1,
			},
			{
				"fieldname": "rw_mark_special_case",
				"fieldtype": "Check",
				"label": "Mark as special case",
				"default": "0",
				"depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"insert_after": "rw_insurance_type",
			},
			{
				"fieldname": "rw_insurance_member_number",
				"fieldtype": "Data",
				"label": "Insurance member / policy number",
				"depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"mandatory_depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"insert_after": "rw_mark_special_case",
				"in_standard_filter": 1,
			},
			{
				"fieldname": "rw_insurance_valid_to",
				"fieldtype": "Date",
				"label": "Insurance valid to",
				"depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"insert_after": "rw_insurance_member_number",
			},
			{
				"fieldname": "rw_is_main_insurer",
				"fieldtype": "Check",
				"label": "Patient is main insurer",
				"default": "1",
				"depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"insert_after": "rw_insurance_valid_to",
			},
			{
				"fieldname": "rw_main_insured_name",
				"fieldtype": "Data",
				"label": "Main insured name",
				"depends_on": 'eval:doc.rw_patient_insured=="Yes" && !doc.rw_is_main_insurer',
				"mandatory_depends_on": 'eval:doc.rw_patient_insured=="Yes" && !doc.rw_is_main_insurer',
				"insert_after": "rw_is_main_insurer",
			},
			{
				"fieldname": "rw_main_insured_insurance_number",
				"fieldtype": "Data",
				"label": "Main insured insurance number",
				"depends_on": 'eval:doc.rw_patient_insured=="Yes" && !doc.rw_is_main_insurer',
				"mandatory_depends_on": 'eval:doc.rw_patient_insured=="Yes" && !doc.rw_is_main_insurer',
				"insert_after": "rw_main_insured_name",
			},
			{
				"fieldname": "rw_rssb_last_verified_on",
				"fieldtype": "Datetime",
				"label": "Insurance last verified",
				"read_only": 1,
				"depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"insert_after": "rw_main_insured_insurance_number",
			},
			{
				"fieldname": "rw_rssb_validation_notes",
				"fieldtype": "Small Text",
				"label": "Insurance verification notes",
				"read_only": 1,
				"depends_on": 'eval:doc.rw_patient_insured=="Yes"',
				"insert_after": "rw_rssb_last_verified_on",
			},
			{
				"fieldname": "rw_record_status",
				"fieldtype": "Select",
				"label": "Registration status",
				"options": "Active\nInactive",
				"default": "Active",
				"insert_after": "rw_rssb_validation_notes",
				"in_standard_filter": 1,
				"in_list_view": 1,
			},
			{
				"fieldname": "rw_inactive_reason",
				"fieldtype": "Small Text",
				"label": "Inactive reason",
				"depends_on": 'eval:doc.rw_record_status=="Inactive"',
				"mandatory_depends_on": 'eval:doc.rw_record_status=="Inactive"',
				"insert_after": "rw_record_status",
			},
		],
	}


def validate_rwanda_patient_registration(doc, method=None):
	"""National ID / UPID / registration rules (called from Patient.validate)."""
	if doc.doctype != "Patient":
		return

	nin = _clean_id(doc.get("rw_national_id"))
	if nin:
		doc.rw_national_id = nin

	_validate_nin_immutable(doc)
	_validate_duplicate_ids(doc)
	_validate_inactive_reason(doc)
	_validate_insurance(doc)


def _clean_id(val):
	if val is None:
		return ""
	return str(val).strip()


def _can_edit_nin():
	roles = set(frappe.get_roles())
	return bool(roles.intersection(set(RWANDA_MPI_ROLES)))


def _validate_nin_immutable(doc):
	if doc.is_new():
		return
	prev = doc.get_doc_before_save()
	if not prev:
		return
	old_nin = _clean_id(prev.get("rw_national_id"))
	new_nin = _clean_id(doc.get("rw_national_id"))
	if old_nin and new_nin != old_nin and not _can_edit_nin():
		frappe.throw(
			_("National ID (NIN) cannot be changed after it is set. Contact an MPI administrator."),
			title=_("Restricted change"),
		)


def _validate_duplicate_ids(doc):
	name = doc.name
	nin = _clean_id(doc.get("rw_national_id"))
	if nin:
		existing = frappe.db.sql(
			"""
			select name from `tabPatient`
			where rw_national_id = %s and name != %s limit 1
			""",
			(nin, name),
		)
		if existing:
			frappe.throw(
				_("National ID (NIN) is already registered to patient {0}").format(existing[0][0]),
				title=_("Duplicate NIN"),
			)

	upid = _clean_id(doc.get("rw_upid"))
	if upid and not doc.get("rw_upid_is_temporary"):
		existing = frappe.db.sql(
			"""
			select name from `tabPatient`
			where rw_upid = %s and ifnull(rw_upid_is_temporary, 0) = 0 and name != %s limit 1
			""",
			(upid, name),
		)
		if existing:
			frappe.throw(
				_("UPID is already assigned to patient {0}").format(existing[0][0]),
				title=_("Duplicate UPID"),
			)


def _validate_inactive_reason(doc):
	if doc.get("rw_record_status") == "Inactive" and not _clean_id(doc.get("rw_inactive_reason")):
		frappe.throw(
			_("Inactive reason is required when registration status is Inactive."),
			title=_("Missing reason"),
		)


def _validate_insurance(doc):
	if doc.get("rw_patient_insured") != "Yes":
		for fieldname in (
			"rw_insurance_type",
			"rw_mark_special_case",
			"rw_insurance_member_number",
			"rw_insurance_valid_to",
			"rw_main_insured_name",
			"rw_main_insured_insurance_number",
			"rw_rssb_last_verified_on",
			"rw_rssb_validation_notes",
		):
			doc.set(fieldname, None)
		doc.rw_is_main_insurer = 1
		doc.rw_mark_special_case = 0
		return
	if not _clean_id(doc.get("rw_insurance_type")):
		frappe.throw(_("Insurance provider is required when the patient is insured."), title=_("Insurance"))
	if not _clean_id(doc.get("rw_insurance_member_number")):
		frappe.throw(
			_("Insurance member / policy number is required when the patient is insured."),
			title=_("Insurance"),
		)
	if not cint(doc.get("rw_is_main_insurer")):
		if not _clean_id(doc.get("rw_main_insured_name")):
			frappe.throw(_("Main insured name is required for dependents."), title=_("Insurance"))
		if not _clean_id(doc.get("rw_main_insured_insurance_number")):
			frappe.throw(_("Main insured insurance number is required for dependents."), title=_("Insurance"))


def _ensure_patient_read():
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.PermissionError)
	frappe.has_permission("Patient", "read", throw=True)


@frappe.whitelist()
def search_patients_rw(
	search_text=None,
	national_id=None,
	upid=None,
	phone=None,
	insurance_member=None,
	limit_start=0,
	limit_page_length=50,
):
	"""Registration desk search by name, UID, NIN, UPID, phone, or insurance member number."""
	_ensure_patient_read()

	limit_start = int(limit_start or 0)
	limit_page_length = min(max(int(limit_page_length or 50), 1), 100)

	st = (search_text or "").strip()
	nid = (national_id or "").strip()
	up = (upid or "").strip()
	ph = (phone or "").strip()
	im = (insurance_member or "").strip()

	clauses = []
	params = []

	if nid:
		clauses.append("p.rw_national_id = %s")
		params.append(nid)
	if up:
		clauses.append("p.rw_upid = %s")
		params.append(up)
	if ph:
		clauses.append("(p.mobile = %s OR p.phone = %s)")
		params.extend([ph, ph])

	if st:
		like = f"%{st}%"
		clauses.append(
			"(p.patient_name LIKE %s OR p.first_name LIKE %s OR p.last_name LIKE %s OR "
			"p.uid LIKE %s OR IFNULL(p.rw_national_id,'') LIKE %s OR IFNULL(p.rw_upid,'') LIKE %s OR IFNULL(p.rw_insurance_member_number,'') LIKE %s)"
		)
		params.extend([like, like, like, like, like, like, like])

	if im:
		clauses.append("IFNULL(p.rw_insurance_member_number,'') = %s")
		params.append(im)

	if not clauses:
		return []

	where_sql = " AND ".join(clauses)
	sql = f"""
		SELECT
			p.name,
			p.patient_name,
			p.sex,
			p.uid,
			p.rw_national_id,
			p.rw_upid,
			p.rw_insurance_type,
			p.rw_insurance_member_number,
			p.dob,
			p.mobile,
			p.phone,
			p.rw_record_status,
			p.modified,
			p.image
		FROM `tabPatient` p
		WHERE {where_sql}
		ORDER BY p.modified DESC
		LIMIT %s OFFSET %s
	"""
	params.extend([limit_page_length, limit_start])

	try:
		return frappe.db.sql(sql, tuple(params), as_dict=True)
	except Exception:
		frappe.log_error(frappe.get_traceback(), "Rwanda patient search")
		frappe.throw(
			_("Patient search failed. Run `bench migrate` after upgrading healthcare."),
			title=_("Patient registration"),
		)


@frappe.whitelist()
def generate_rw_temp_upid():
	"""Temporary UPID when HIE / client registry is offline."""
	if not (set(frappe.get_roles()).intersection(set(RWANDA_MPI_ROLES)) or frappe.has_permission("Patient", "create")):
		frappe.throw(_("Not permitted to generate a temporary UPID."), frappe.PermissionError)
	prefix = "RW-TMP-"
	for _ in range(20):
		candidate = prefix + frappe.generate_hash(length=8).upper()
		if not frappe.db.exists("Patient", {"rw_upid": candidate}):
			return candidate
	frappe.throw(_("Could not generate a unique temporary UPID. Retry."), title=_("Patient registration"))


@frappe.whitelist()
def check_insurance_eligibility(patient):
	"""Stub RSSB eligibility check — records verification timestamp on the patient."""
	frappe.has_permission("Patient", "write", doc=patient, throw=True)
	doc = frappe.get_doc("Patient", patient)

	if doc.get("rw_patient_insured") != "Yes":
		frappe.throw(_("Set Patient insured? to Yes before checking eligibility."))

	if not _clean_id(doc.get("rw_insurance_member_number")):
		frappe.throw(_("Enter insurance member / policy number before checking eligibility."))

	now = frappe.utils.now_datetime()
	notes = _(
		"Eligibility recorded from desk (stub). Connect RSSB API in a later release for live validation."
	)
	frappe.db.set_value("Patient", patient, "rw_rssb_last_verified_on", now, update_modified=False)
	frappe.db.set_value("Patient", patient, "rw_rssb_validation_notes", notes, update_modified=False)

	return {
		"valid": True,
		"message": _("Insurance verification recorded at {0}").format(
			frappe.utils.format_datetime(now)
		),
	}
