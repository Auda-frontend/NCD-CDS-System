// Rwanda triage desk — auto priority, then orientation (visit created at orient)

frappe.ui.form.on("Vital Signs", {
	refresh(frm) {
		rw_triage_setup_desk(frm);
	},

	onload(frm) {
		if (frm.is_new() && frappe.route_options) {
			const ro = frappe.route_options;
			["patient", "encounter", "appointment", "company"].forEach((f) => {
				if (ro[f] && !frm.doc[f]) {
					frm.set_value(f, ro[f]);
				}
			});
			if (ro.rw_chief_complaint && !frm.doc.rw_chief_complaint) {
				frm.set_value("rw_chief_complaint", ro.rw_chief_complaint);
			}
		}
	},

	rw_triage_manual_override(frm) {
		rw_triage_recompute(frm);
	},

	temperature(frm) {
		rw_triage_recompute(frm);
	},
	pulse(frm) {
		rw_triage_recompute(frm);
	},
	respiratory_rate(frm) {
		rw_triage_recompute(frm);
	},
	bp_systolic(frm) {
		rw_triage_recompute(frm);
	},
	bp_diastolic(frm) {
		rw_triage_recompute(frm);
	},
	rw_spo2(frm) {
		rw_triage_recompute(frm);
	},
	rw_pain_score(frm) {
		rw_triage_recompute(frm);
	},
});

function rw_triage_setup_desk(frm) {
	if (!frm.fields_dict.rw_triage_category) {
		return;
	}

	if (frm.doc.rw_triage_category === "Emergency") {
		frm.dashboard.add_indicator(__("Emergency — attend immediately"), "red");
	} else if (frm.doc.rw_triage_category === "Urgent") {
		frm.dashboard.add_indicator(__("Urgent"), "orange");
	}

	if (frm.is_new()) {
		frm.set_intro(
			__(
				"Record vitals and chief complaint. Priority is set automatically from alarming signs. After save, orient the patient to a service (OPD, NCD, …) to create their visit."
			),
			"blue"
		);
	}

	if (!frm.is_new() && !frm.doc.rw_oriented) {
		frm.add_custom_button(__("Orient to service"), () => rw_triage_open_orientation(frm), __("Workflow"));
		frm.add_custom_button(
			__("Open orientation desk"),
			() => frappe.set_route("patient-orientation"),
			__("Workflow")
		);
	} else if (frm.doc.rw_oriented) {
		frm.set_intro(__("Patient oriented — visit created. Use Department Queue to call patient."), "green");
	}
}

function rw_triage_recompute(frm) {
	if (frm.doc.rw_triage_manual_override) {
		return;
	}
	frappe.call({
		method: "healthcare.healthcare.rwanda_opd.compute_triage_priority_api",
		args: { doc: frm.doc },
		callback(r) {
			if (!r.message) {
				return;
			}
			frm.set_value("rw_triage_category", r.message.category);
			frm.set_value("rw_triage_alerts", (r.message.alerts || []).join("\n"));
		},
	});
}

function rw_triage_open_orientation(frm) {
	if (!frm.doc.name) {
		frappe.msgprint(__("Save triage before orienting the patient."));
		return;
	}
	frappe.route_options = { triage: frm.doc.name };
	frappe.set_route("patient-orientation");
}
