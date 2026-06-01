// Rwanda patient registration desk UX (Phase A)

const RW_INSURANCE_FIELDS = [
	"rw_insurance_type",
	"rw_mark_special_case",
	"rw_insurance_member_number",
	"rw_insurance_valid_to",
	"rw_is_main_insurer",
	"rw_main_insured_name",
	"rw_main_insured_insurance_number",
	"rw_rssb_last_verified_on",
	"rw_rssb_validation_notes",
];

frappe.ui.form.on("Patient", {
	refresh(frm) {
		rw_patient_setup_insurance_visibility(frm);
		rw_patient_setup_registration_desk(frm);
	},

	rw_patient_insured(frm) {
		rw_patient_setup_insurance_visibility(frm);
		if (frm.doc.rw_patient_insured === "No") {
			RW_INSURANCE_FIELDS.forEach((f) => frm.set_value(f, null));
			frm.set_value("rw_mark_special_case", 0);
			frm.set_value("rw_is_main_insurer", 1);
		}
	},

	rw_is_main_insurer(frm) {
		rw_patient_toggle_main_insured_fields(frm);
	},

	rw_national_id(frm) {
		if (frm.doc.rw_national_id && frm.is_new()) {
			rw_patient_check_duplicate_nin(frm);
		}
	},
});

function rw_patient_setup_registration_desk(frm) {
	if (!frm.fields_dict.rw_reg_search_help) {
		return;
	}

	if (frm.is_new()) {
		frm.set_intro(
			__(
				"Search for an existing patient first (UPID, full name, NIN, or phone) to avoid duplicates."
			),
			"blue"
		);

		frm.add_custom_button(__("Find Existing Patient"), () => rw_patient_open_search_dialog(frm), __("Registration"));

		if (frappe.model.can_create("Patient")) {
			frm.add_custom_button(__("Generate Temporary UPID"), () => rw_patient_generate_temp_upid(frm), __("Registration"));
		}
	} else {
		frm.set_intro();
		rw_patient_workflow_buttons(frm);
	}

	if (frm.doc.rw_patient_insured === "Yes" && !frm.is_new()) {
		frm.add_custom_button(__("Check Eligibility"), () => rw_patient_check_eligibility(frm), __("Registration"));
	}
}

function rw_patient_workflow_buttons(frm) {
	const group = __("Workflow");
	frm.add_custom_button(__("Record triage"), () => {
		frappe.route_options = { patient: frm.doc.name };
		frappe.new_doc("Vital Signs");
	}, group);
	frm.add_custom_button(__("Patient orientation"), () => frappe.set_route("patient-orientation"), group);
	frm.add_custom_button(__("Department queue"), () => frappe.set_route("department-queue"), group);
}

function rw_patient_setup_insurance_visibility(frm) {
	const insured = frm.doc.rw_patient_insured === "Yes";
	RW_INSURANCE_FIELDS.forEach((fieldname) => {
		frm.toggle_display(fieldname, insured);
	});
	rw_patient_toggle_main_insured_fields(frm);
}

function rw_patient_toggle_main_insured_fields(frm) {
	const show_main = frm.doc.rw_patient_insured === "Yes" && !frm.doc.rw_is_main_insurer;
	frm.toggle_display("rw_main_insured_name", show_main);
	frm.toggle_display("rw_main_insured_insurance_number", show_main);
	if (frm.doc.rw_is_main_insurer) {
		frm.set_value("rw_main_insured_name", null);
		frm.set_value("rw_main_insured_insurance_number", null);
	}
}

function rw_patient_open_search_dialog(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Find Existing Patient"),
		fields: [
			{
				fieldtype: "Small Text",
				fieldname: "search_text",
				label: __("Name or partial ID"),
				description: __("Full name, first name, last name, UID, NIN, or UPID"),
			},
			{ fieldtype: "Column Break" },
			{ fieldtype: "Data", fieldname: "national_id", label: __("National ID (NIN)") },
			{ fieldtype: "Data", fieldname: "upid", label: __("UPID") },
			{ fieldtype: "Data", fieldname: "phone", label: __("Phone") },
			{ fieldtype: "Data", fieldname: "insurance_member", label: __("Insurance member number") },
		],
		primary_action_label: __("Search"),
		primary_action(values) {
			if (!values.search_text && !values.national_id && !values.upid && !values.phone && !values.insurance_member) {
				frappe.msgprint(__("Enter at least one search criterion."));
				return;
			}
			frappe.call({
				method: "healthcare.healthcare.rwanda_registration.search_patients_rw",
				args: {
					search_text: values.search_text,
					national_id: values.national_id,
					upid: values.upid,
					phone: values.phone,
					insurance_member: values.insurance_member,
					limit_page_length: 20,
				},
				freeze: true,
				callback(r) {
					rw_patient_show_search_results(frm, d, r.message || []);
				},
			});
		},
	});
	d.show();
}

function rw_patient_show_search_results(frm, dialog, rows) {
	if (!rows.length) {
		frappe.msgprint(__("No matching patients found. You may continue with new registration."));
		return;
	}

	const html = `
		<div class="rw-patient-search-results" style="max-height:320px;overflow:auto;">
			<table class="table table-bordered table-sm">
				<thead>
					<tr>
						<th>${__("Name")}</th>
						<th>${__("NIN")}</th>
						<th>${__("UPID")}</th>
						<th>${__("Phone")}</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					${rows
						.map(
							(row) => `
						<tr>
							<td>${frappe.utils.escape_html(row.patient_name || row.name)}</td>
							<td>${frappe.utils.escape_html(row.rw_national_id || "")}</td>
							<td>${frappe.utils.escape_html(row.rw_upid || "")}</td>
							<td>${frappe.utils.escape_html(row.mobile || row.phone || "")}</td>
							<td><button class="btn btn-xs btn-primary rw-open-patient" data-name="${frappe.utils.escape_html(
								row.name
							)}">${__("Open")}</button></td>
						</tr>`
						)
						.join("")}
				</tbody>
			</table>
		</div>`;

	const result_dialog = new frappe.ui.Dialog({
		title: __("Search Results ({0})", [rows.length]),
		fields: [{ fieldtype: "HTML", fieldname: "results_html" }],
		primary_action_label: __("Continue New Registration"),
		primary_action() {
			result_dialog.hide();
		},
	});

	result_dialog.fields_dict.results_html.$wrapper.html(html);
	result_dialog.fields_dict.results_html.$wrapper.find(".rw-open-patient").on("click", function () {
		const name = $(this).data("name");
		result_dialog.hide();
		dialog.hide();
		frappe.set_route("Form", "Patient", name);
	});
	result_dialog.show();
}

function rw_patient_check_duplicate_nin(frm) {
	frappe.call({
		method: "healthcare.healthcare.rwanda_registration.search_patients_rw",
		args: { national_id: frm.doc.rw_national_id, limit_page_length: 1 },
		callback(r) {
			const rows = r.message || [];
			if (rows.length && rows[0].name !== frm.doc.name) {
				frappe.msgprint({
					title: __("Duplicate NIN"),
					indicator: "orange",
					message: __("National ID is already registered to patient {0}.", [
						`<a href="/app/patient/${rows[0].name}">${rows[0].patient_name || rows[0].name}</a>`,
					]),
				});
			}
		},
	});
}

function rw_patient_generate_temp_upid(frm) {
	frappe.call({
		method: "healthcare.healthcare.rwanda_registration.generate_rw_temp_upid",
		callback(r) {
			if (r.message) {
				frm.set_value("rw_upid", r.message);
				frm.set_value("rw_upid_is_temporary", 1);
				frm.set_value("rw_upid_source", "Local Temporary");
			}
		},
	});
}

function rw_patient_check_eligibility(frm) {
	if (!frm.doc.name) {
		frappe.msgprint(__("Save the patient before checking eligibility."));
		return;
	}
	if (!frm.doc.rw_insurance_member_number) {
		frappe.msgprint(__("Enter the insurance member / policy number first."));
		return;
	}
	frappe.call({
		method: "healthcare.healthcare.rwanda_registration.check_insurance_eligibility",
		args: { patient: frm.doc.name },
		freeze: true,
		callback(r) {
			if (r.message) {
				frm.reload_doc();
				frappe.show_alert({
					message: r.message.message || __("Eligibility check recorded."),
					indicator: r.message.valid ? "green" : "orange",
				});
			}
		},
	});
}
