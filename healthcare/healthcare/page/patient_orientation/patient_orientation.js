frappe.pages["patient-orientation"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Patient Orientation"),
		single_column: true,
	});

	new PatientOrientation(wrapper);
};

class PatientOrientation {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find(".layout-main-section");
		this.wrapper.html(frappe.render_template("patient_orientation"));
		this.table_host = this.wrapper.find(".patient-orientation-table-wrapper");
		this.filter_host = this.wrapper.find(".patient-orientation-filters");
		this.make_filters();
		this.refresh();
	}

	make_filters() {
		this.filter_host.html(`
			<div class="col-sm-4">
				<label class="text-muted small">${__("Date")}</label>
				<input type="date" class="form-control patient-orientation-date" />
			</div>
			<div class="col-sm-4 d-flex align-items-end">
				<button class="btn btn-primary btn-sm patient-orientation-refresh">${__("Refresh")}</button>
			</div>
		`);
		this.date_input = this.filter_host.find(".patient-orientation-date");
		this.date_input.val(frappe.datetime.get_today());
		this.filter_host.find(".patient-orientation-refresh").on("click", () => this.refresh());
	}

	refresh() {
		frappe.call({
			method: "healthcare.healthcare.rwanda_opd.get_patients_pending_orientation",
			args: { visit_date: this.date_input.val() },
			freeze: true,
			callback: (r) => this.render_table(r.message || []),
		});
	}

	render_table(rows) {
		if (!rows.length) {
			this.table_host.html(
				`<p class="text-muted">${__("No patients waiting for orientation. Record triage first.")}</p>`
			);
			return;
		}

		const triage_colors = {
			Emergency: "red",
			Urgent: "orange",
			"Non-urgent": "yellow",
			Routine: "green",
		};

		const body = rows
			.map((row) => {
				const triage = row.rw_triage_category || "";
				const alerts = (row.rw_triage_alerts || "").replace(/\n/g, "; ");
				return `<tr class="${triage === "Emergency" ? "table-danger" : ""}">
					<td>${frappe.utils.escape_html(row.patient_name || row.patient)}</td>
					<td>${frappe.utils.escape_html(row.rw_upid || "")}</td>
					<td>${triage ? `<span class="indicator-pill ${triage_colors[triage] || "grey"}">${__(triage)}</span>` : ""}</td>
					<td>${frappe.utils.escape_html(row.rw_chief_complaint || "")}</td>
					<td class="small text-muted">${frappe.utils.escape_html(alerts)}</td>
					<td>${row.signs_time || ""}</td>
					<td><button class="btn btn-xs btn-primary" data-triage="${frappe.utils.escape_html(row.triage)}">${__("Orient")}</button></td>
				</tr>`;
			})
			.join("");

		this.table_host.html(`
			<table class="table table-bordered table-hover">
				<thead>
					<tr>
						<th>${__("Patient")}</th>
						<th>${__("UPID")}</th>
						<th>${__("Priority")}</th>
						<th>${__("Chief complaint")}</th>
						<th>${__("Alerts")}</th>
						<th>${__("Time")}</th>
						<th></th>
					</tr>
				</thead>
				<tbody>${body}</tbody>
			</table>
		`);

		this.table_host.find("button[data-triage]").on("click", (e) => {
			this.open_orient_dialog($(e.currentTarget).attr("data-triage"));
		});
	}

	open_orient_dialog(triage) {
		const d = new frappe.ui.Dialog({
			title: __("Orient patient to service"),
			fields: [
				{
					fieldtype: "Select",
					fieldname: "oriented_service",
					label: __("Service"),
					options: ["OPD", "NCD", "MCH", "ART", "TB", "Emergency", "Pharmacy", "Laboratory", "Other"].join("\n"),
					reqd: 1,
					default: "OPD",
				},
				{
					fieldtype: "Link",
					fieldname: "medical_department",
					label: __("Department (queue)"),
					options: "Medical Department",
					reqd: 1,
				},
				{
					fieldtype: "Link",
					fieldname: "practitioner",
					label: __("Healthcare Practitioner"),
					options: "Healthcare Practitioner",
				},
				{
					fieldtype: "Link",
					fieldname: "company",
					label: __("Company"),
					options: "Company",
					default: frappe.defaults.get_user_default("Company"),
				},
			],
			primary_action_label: __("Orient & create visit"),
			primary_action: (values) => {
				frappe.call({
					method: "healthcare.healthcare.rwanda_opd.orient_patient_to_service",
					args: { triage, ...values },
					freeze: true,
					callback: (r) => {
						if (r.message) {
							frappe.show_alert({
								message: __("Visit created — queue #{0}", [r.message.queue_number]),
								indicator: "green",
							});
							d.hide();
							this.refresh();
							frappe.set_route("department-queue", {
								medical_department: values.medical_department,
								oriented_service: values.oriented_service,
							});
						}
					},
				});
			},
		});
		d.show();
	}
}
