// Booking remains scheduling-only; clinical flow is Registration → Triage → Orientation → Queue.

frappe.ui.form.on("Patient Appointment", {
	refresh(frm) {
		if (frm.is_new() || ["Cancelled", "Closed", "No Show"].includes(frm.doc.status)) {
			return;
		}
		frm.add_custom_button(
			__("Record triage for patient"),
			() => {
				frappe.route_options = { patient: frm.doc.patient, appointment: frm.doc.name, company: frm.doc.company };
				frappe.new_doc("Vital Signs");
			},
			__("Workflow")
		);
	},
});
