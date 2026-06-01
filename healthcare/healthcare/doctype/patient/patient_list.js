// Rwanda registration desk — quick filters on Patient list

frappe.listview_settings["Patient"] = {
	add_fields: [
		"rw_national_id",
		"rw_upid",
		"mobile",
		"rw_insurance_member_number",
		"rw_patient_insured",
		"rw_insurance_type",
		"rw_record_status",
	],
	get_indicator(doc) {
		if (doc.rw_record_status === "Inactive") {
			return [__("Inactive"), "gray", "rw_record_status,=,Inactive"];
		}
		return [__("Active"), "green", "rw_record_status,=,Active"];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Registration Search"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Find Patient"),
				fields: [
					{ fieldtype: "Data", fieldname: "search_text", label: __("Name or partial ID") },
					{ fieldtype: "Data", fieldname: "national_id", label: __("National ID (NIN)") },
					{ fieldtype: "Data", fieldname: "upid", label: __("UPID") },
					{ fieldtype: "Data", fieldname: "phone", label: __("Phone") },
					{ fieldtype: "Data", fieldname: "insurance_member", label: __("Insurance member number") },
				],
				primary_action_label: __("Search"),
				primary_action(values) {
					frappe.call({
						method: "healthcare.healthcare.rwanda_registration.search_patients_rw",
						args: { ...values, limit_page_length: 50 },
						callback(r) {
							const rows = r.message || [];
							if (!rows.length) {
								frappe.msgprint(__("No patients found."));
								return;
							}
							if (rows.length === 1) {
								frappe.set_route("Form", "Patient", rows[0].name);
								d.hide();
								return;
							}
							const names = rows.map((row) => row.name).join(",");
							listview.filter_area.add([[listview.doctype, "name", "in", names.split(",")]]);
							d.hide();
						},
					});
				},
			});
			d.show();
		});
	},
};
