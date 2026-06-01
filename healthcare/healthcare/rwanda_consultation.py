# -*- coding: utf-8 -*-
# Rwanda OPD consultation form (Patient Encounter) — fields, validation, desk UX.

import frappe
from frappe import _
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

VISIT_OUTCOMES = (
	"Discharged home",
	"Follow-up required",
	"Referred out",
	"Admitted",
	"Left without being seen",
	"Deceased",
	"Other",
)

# Core Marley fields hidden or de-emphasized on the Rwanda consultation form.
CONSULTATION_HIDDEN_FIELDS = (
	"google_meet_link",
	"get_applicable_treatment_plans",
	"submit_orders_on_save",
	"therapy_plan",
	"rehabilitation_section",
	"therapies",
)


def install_rwanda_consultation():
	create_custom_fields(get_rwanda_consultation_custom_fields(), update=True)
	apply_consultation_form_labels()
	hide_consultation_clutter_fields()
	frappe.clear_cache()


def get_rwanda_consultation_custom_fields():
	return {
		"Patient Encounter": get_consultation_encounter_fields(),
	}


def get_consultation_encounter_fields():
	return [
		# --- Visit & triage tab (summary) ---
		{
			"fieldname": "rw_triage_vitals_html",
			"fieldtype": "HTML",
			"label": "Triage vitals",
			"insert_after": "rw_chief_complaint",
		},
		{
			"fieldname": "rw_insurance_sb",
			"fieldtype": "Section Break",
			"label": "Insurance (from registration)",
			"insert_after": "rw_triage_vitals_html",
			"collapsible": 1,
		},
		{
			"fieldname": "rw_insurance_provider",
			"fieldtype": "Data",
			"label": "Insurance provider",
			"fetch_from": "patient.rw_insurance_type",
			"read_only": 1,
			"insert_after": "rw_insurance_sb",
		},
		{
			"fieldname": "rw_insurance_member_number",
			"fieldtype": "Data",
			"label": "Insurance member number",
			"fetch_from": "patient.rw_insurance_member_number",
			"read_only": 1,
			"insert_after": "rw_insurance_provider",
		},
		{
			"fieldname": "rw_patient_insured",
			"fieldtype": "Data",
			"label": "Patient insured",
			"fetch_from": "patient.rw_patient_insured",
			"read_only": 1,
			"insert_after": "rw_insurance_member_number",
		},
		# --- Consultation tab (clinical narrative before Marley symptom/dx blocks) ---
		{
			"fieldname": "rw_history_present_illness",
			"fieldtype": "Text Editor",
			"label": "History of present illness (HPI)",
			"insert_after": "rw_tab_consultation",
		},
		{
			"fieldname": "rw_physical_examination_notes",
			"fieldtype": "Text Editor",
			"label": "Physical examination",
			"insert_after": "rw_history_present_illness",
		},
		{
			"fieldname": "rw_clinical_impression",
			"fieldtype": "Small Text",
			"label": "Clinical impression",
			"insert_after": "rw_physical_examination_notes",
		},
		{
			"fieldname": "rw_diagnosis_help",
			"fieldtype": "HTML",
			"options": (
				'<p class="text-muted small">'
				"<b>Diagnosis is mandatory</b> before submitting this consultation. "
				"Add at least one diagnosis below (ICD / facility diagnosis list)."
				"</p>"
			),
			"insert_after": "rw_clinical_impression",
		},
		# --- Orders tab (prescriptions / investigations) ---
		{
			"fieldname": "rw_tab_orders",
			"fieldtype": "Tab Break",
			"label": "Orders",
			"insert_after": "codification_table",
		},
		# --- Discharge & follow-up tab ---
		{
			"fieldname": "rw_tab_discharge",
			"fieldtype": "Tab Break",
			"label": "Discharge & follow-up",
			"insert_after": "encounter_comment",
		},
		{
			"fieldname": "rw_visit_outcome",
			"fieldtype": "Select",
			"label": "Visit outcome",
			"options": "\n".join(VISIT_OUTCOMES),
			"insert_after": "rw_tab_discharge",
			"in_list_view": 1,
		},
		{
			"fieldname": "rw_discharge_summary",
			"fieldtype": "Text Editor",
			"label": "Discharge summary",
			"insert_after": "rw_visit_outcome",
		},
		{
			"fieldname": "rw_patient_instructions",
			"fieldtype": "Text Editor",
			"label": "Patient instructions / advice",
			"insert_after": "rw_discharge_summary",
		},
		{
			"fieldname": "rw_col_followup",
			"fieldtype": "Column Break",
			"insert_after": "rw_patient_instructions",
		},
		{
			"fieldname": "rw_follow_up_required",
			"fieldtype": "Check",
			"label": "Follow-up required",
			"default": "0",
			"insert_after": "rw_col_followup",
		},
		{
			"fieldname": "rw_follow_up_date",
			"fieldtype": "Date",
			"label": "Follow-up date",
			"depends_on": "eval:doc.rw_follow_up_required",
			"mandatory_depends_on": "eval:doc.rw_follow_up_required",
			"insert_after": "rw_follow_up_required",
		},
		{
			"fieldname": "rw_follow_up_notes",
			"fieldtype": "Small Text",
			"label": "Follow-up notes",
			"depends_on": "eval:doc.rw_follow_up_required",
			"insert_after": "rw_follow_up_date",
		},
		{
			"fieldname": "rw_referral_sb",
			"fieldtype": "Section Break",
			"label": "Referral",
			"insert_after": "rw_follow_up_notes",
			"collapsible": 1,
		},
		{
			"fieldname": "rw_referral_required",
			"fieldtype": "Check",
			"label": "Referral required",
			"default": "0",
			"insert_after": "rw_referral_sb",
		},
		{
			"fieldname": "rw_referral_facility",
			"fieldtype": "Data",
			"label": "Referral facility",
			"depends_on": "eval:doc.rw_referral_required",
			"mandatory_depends_on": "eval:doc.rw_referral_required",
			"insert_after": "rw_referral_required",
		},
		{
			"fieldname": "rw_referral_department",
			"fieldtype": "Data",
			"label": "Referral department / service",
			"depends_on": "eval:doc.rw_referral_required",
			"insert_after": "rw_referral_facility",
		},
		{
			"fieldname": "rw_referral_reason",
			"fieldtype": "Small Text",
			"label": "Referral reason",
			"depends_on": "eval:doc.rw_referral_required",
			"mandatory_depends_on": "eval:doc.rw_referral_required",
			"insert_after": "rw_referral_department",
		},
	]


def apply_consultation_form_labels():
	from healthcare.healthcare.rwanda_opd import set_encounter_field_property

	set_encounter_field_property("sb_symptoms", "label", "Complaints & symptoms")
	set_encounter_field_property("diagnosis", "label", "Diagnosis (required)")
	set_encounter_field_property("symptoms", "label", "Presenting complaints")
	set_encounter_field_property("encounter_comment", "label", "Internal consultation notes")
	set_encounter_field_property("encounter_details_tab", "label", "Order history")
	set_encounter_field_property("notes_tab", "label", "Clinical notes")
	set_encounter_field_property("codification", "label", "ICD / medical coding")
	set_encounter_field_property("appointment", "label", "Booking (optional)")


def hide_consultation_clutter_fields():
	from healthcare.healthcare.rwanda_opd import set_encounter_field_hidden

	for fieldname in CONSULTATION_HIDDEN_FIELDS:
		set_encounter_field_hidden(fieldname, hidden=1)


def validate_rwanda_consultation(doc, method=None):
	if doc.doctype != "Patient Encounter":
		return

	_validate_consultation_workflow_state(doc)

	if doc.flags.get("ignore_rwanda_consultation_validation"):
		return

	# Draft saves while in consultation: soft checks only
	if doc.docstatus == 0 and doc.get("rw_opd_visit_status") == "In Consultation":
		_validate_follow_up_and_referral(doc)


def before_submit_rwanda_consultation(doc, method=None):
	if doc.doctype != "Patient Encounter":
		return
	_validate_mandatory_diagnosis(doc)
	_validate_follow_up_and_referral(doc)
	_validate_visit_outcome_on_submit(doc)


def validate_before_complete_consultation(doc):
	"""Called from complete_consultation API."""
	if doc.docstatus != 1:
		frappe.throw(_("Submit the consultation before completing the visit."), title=_("Consultation"))
	_validate_mandatory_diagnosis(doc)
	_validate_follow_up_and_referral(doc)
	if not doc.get("rw_visit_outcome"):
		frappe.throw(_("Select a visit outcome on the Discharge & follow-up tab."), title=_("Consultation"))


def _validate_consultation_workflow_state(doc):
	"""Encounters from orientation should be started from the queue before clinical entry."""
	if doc.is_new():
		return
	if doc.get("rw_opd_visit_status") == "Waiting" and doc.has_value_changed(
		"rw_history_present_illness"
	):
		frappe.msgprint(
			_("Use Proceed to attend from the department queue before documenting the consultation."),
			indicator="orange",
			title=_("Consultation"),
		)


def _validate_mandatory_diagnosis(doc):
	if not doc.get("diagnosis") or len(doc.diagnosis) == 0:
		frappe.throw(
			_("At least one diagnosis is required before submitting the consultation."),
			title=_("Diagnosis required"),
		)


def _validate_follow_up_and_referral(doc):
	if doc.get("rw_follow_up_required") and not doc.get("rw_follow_up_date"):
		frappe.throw(_("Follow-up date is required when follow-up is checked."), title=_("Follow-up"))
	if doc.get("rw_referral_required"):
		if not _text(doc.get("rw_referral_facility")):
			frappe.throw(_("Referral facility is required."), title=_("Referral"))
		if not _text(doc.get("rw_referral_reason")):
			frappe.throw(_("Referral reason is required."), title=_("Referral"))
	if doc.get("rw_visit_outcome") == "Referred out" and not doc.get("rw_referral_required"):
		frappe.msgprint(
			_("Visit outcome is Referred out — consider completing the referral section."),
			indicator="orange",
			title=_("Referral"),
		)


def _validate_visit_outcome_on_submit(doc):
	if not doc.get("rw_visit_outcome"):
		frappe.msgprint(
			_("Select a visit outcome on the Discharge & follow-up tab before completing the visit."),
			indicator="orange",
			title=_("Visit outcome"),
		)


def build_triage_vitals_html(triage_name):
	if not triage_name or not frappe.db.exists("Vital Signs", triage_name):
		return "<p class='text-muted small'>" + _("No triage vitals linked.") + "</p>"

	vs = frappe.get_doc("Vital Signs", triage_name)
	rows = [
		(_("Priority"), vs.get("rw_triage_category") or "—"),
		(_("Temperature"), vs.get("temperature") or "—"),
		(_("Pulse"), vs.get("pulse") or "—"),
		(_("Resp. rate"), vs.get("respiratory_rate") or "—"),
		(_("BP"), vs.get("bp") or "—"),
		(_("SpO₂"), vs.get("rw_spo2") or "—"),
		(_("MUAC"), vs.get("rw_muac") or "—"),
		(_("Pain"), vs.get("rw_pain_score") if vs.get("rw_pain_score") is not None else "—"),
		(_("Weight"), vs.get("weight") or "—"),
		(_("Height"), vs.get("height") or "—"),
		(_("BMI"), vs.get("bmi") or "—"),
	]
	alerts = vs.get("rw_triage_alerts") or ""

	html = "<div class='rw-triage-vitals-summary'><table class='table table-sm table-bordered'><tbody>"
	for label, val in rows:
		html += f"<tr><td class='text-muted' style='width:35%'>{frappe.utils.escape_html(str(label))}</td>"
		html += f"<td><b>{frappe.utils.escape_html(str(val))}</b></td></tr>"
	html += "</tbody></table>"
	if alerts:
		html += (
			"<p class='text-danger small mb-0'><b>"
			+ frappe.utils.escape_html(_("Alerts"))
			+ ":</b> "
			+ frappe.utils.escape_html(alerts.replace("\n", "; "))
			+ "</p>"
		)
	html += "</div>"
	return html


@frappe.whitelist()
def get_consultation_triage_summary(encounter):
	frappe.has_permission("Patient Encounter", "read", doc=encounter, throw=True)
	triage = frappe.db.get_value("Patient Encounter", encounter, "rw_triage")
	return {"html": build_triage_vitals_html(triage)}


def _text(val):
	if val is None:
		return ""
	return str(val).strip()
