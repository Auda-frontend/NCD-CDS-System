frappe.pages["department-queue"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Department Queue"),
		single_column: true,
	});

	new DepartmentQueue(wrapper);
};

class DepartmentQueue {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find(".layout-main-section");
		this.wrapper.html(frappe.render_template("department_queue"));
		this.table_host = this.wrapper.find(".department-queue-table-wrapper");
		this.filter_host = this.wrapper.find(".department-queue-filters");
		this.legend_host = this.wrapper.find(".department-queue-legend");
		this.make_filters();
		this.legend_host.html(
			`${__("Critical patients (Emergency/Urgent) are listed first, then by queue number. Status <b>Waiting</b> means the patient is in the queue and has not been called yet.")}`
		);
		this.table_host.html(
			`<p class="text-muted">${__("Select the same Medical Department you used at orientation, then click Refresh.")}</p>`
		);
		this.load_defaults_and_refresh();
	}

	load_defaults_and_refresh() {
		frappe.call({
			method: "healthcare.healthcare.rwanda_opd.get_default_queue_department",
			callback: (r) => {
				if (r.message && !this.department_control.get_value()) {
					this.department_control.set_value(r.message);
				}
				if (this.department_control.get_value()) {
					this.refresh();
				}
			},
		});
	}

	make_filters() {
		this.filter_host.html(`
			<div class="col-sm-2">
				<label class="text-muted small">${__("Date")}</label>
				<input type="date" class="form-control department-queue-date" />
			</div>
			<div class="col-sm-3">
				<label class="text-muted small">${__("Department")}</label>
				<div class="department-queue-department"></div>
			</div>
			<div class="col-sm-2">
				<label class="text-muted small">${__("Service")}</label>
				<select class="form-control department-queue-service">
					<option value="">${__("All")}</option>
					<option>OPD</option><option>NCD</option><option>MCH</option><option>ART</option>
					<option>TB</option><option>Emergency</option><option>Pharmacy</option>
					<option>Laboratory</option><option>Other</option>
				</select>
			</div>
			<div class="col-sm-3">
				<label class="text-muted small">${__("Company")}</label>
				<div class="department-queue-company"></div>
			</div>
			<div class="col-sm-2 d-flex align-items-end">
				<button class="btn btn-primary btn-sm department-queue-refresh">${__("Refresh")}</button>
			</div>
		`);

		this.date_input = this.filter_host.find(".department-queue-date");
		this.date_input.val(frappe.datetime.get_today());
		this.service_input = this.filter_host.find(".department-queue-service");

		this.department_control = frappe.ui.form.make_control({
			parent: this.filter_host.find(".department-queue-department")[0],
			df: { fieldtype: "Link", options: "Medical Department", fieldname: "medical_department" },
			render_input: true,
		});

		this.company_control = frappe.ui.form.make_control({
			parent: this.filter_host.find(".department-queue-company")[0],
			df: { fieldtype: "Link", options: "Company", fieldname: "company" },
			render_input: true,
		});

		const route = frappe.get_route();
		if (route.length > 1) {
			// department-queue/DEPT-001 optional route args not used; use frappe.route_options
		}
		if (frappe.route_options) {
			if (frappe.route_options.medical_department) {
				this.department_control.set_value(frappe.route_options.medical_department);
			}
			if (frappe.route_options.oriented_service) {
				this.service_input.val(frappe.route_options.oriented_service);
			}
		}

		this.filter_host.find(".department-queue-refresh").on("click", () => this.refresh());
	}

	refresh() {
		const dept = this.department_control.get_value();
		if (!dept) {
			frappe.msgprint(__("Select a Medical Department to view the queue."));
			return;
		}
		frappe.call({
			method: "healthcare.healthcare.rwanda_opd.get_department_queue",
			args: {
				medical_department: dept,
				oriented_service: this.service_input.val() || null,
				visit_date: this.date_input.val(),
				company: this.company_control.get_value(),
			},
			freeze: true,
			callback: (r) => this.render_table(r.message || []),
		});
	}

	render_table(rows) {
		if (!rows.length) {
			const dept = this.department_control.get_value();
			const dt = this.date_input.val();
			this.table_host.html(`
				<div class="text-muted">
					<p>${__("No patients in the queue for <b>{0}</b> on <b>{1}</b>.", [dept, dt])}</p>
					<ul class="small">
						<li>${__("Use the same department selected at Patient Orientation.")}</li>
						<li>${__("Confirm the visit date matches the triage date.")}</li>
						<li>${__("Clear the Service filter (set to All) if you used a different service label.")}</li>
					</ul>
				</div>
			`);
			return;
		}

		const triage_colors = {
			Emergency: "red",
			Urgent: "orange",
			"Non-urgent": "yellow",
			Routine: "green",
		};
		const status_colors = { Waiting: "blue", "In Consultation": "yellow" };

		const body = rows
			.map((row) => {
				const triage = row.rw_triage_category || "";
				const is_critical = triage === "Emergency" || triage === "Urgent";
				return `<tr class="${is_critical ? "table-warning" : ""}">
					<td><strong>#${row.rw_queue_number || "—"}</strong></td>
					<td>${frappe.utils.escape_html(row.patient_name || row.patient)}</td>
					<td>${frappe.utils.escape_html(row.rw_patient_upid || "")}</td>
					<td>${triage ? `<span class="indicator-pill ${triage_colors[triage] || "grey"}">${__(triage)}</span>` : ""}</td>
					<td><span class="indicator-pill ${status_colors[row.rw_opd_visit_status] || "grey"}">${__(row.rw_opd_visit_status)}</span></td>
					<td>${frappe.utils.escape_html(row.rw_oriented_service || "")}</td>
					<td class="small">${frappe.utils.escape_html((row.rw_triage_alerts || "").split("\n")[0] || "")}</td>
					<td>
						<button class="btn btn-xs btn-primary btn-attend" data-encounter="${frappe.utils.escape_html(row.name)}"
							${row.rw_opd_visit_status === "In Consultation" ? "disabled" : ""}>
							${row.rw_opd_visit_status === "In Consultation" ? __("In progress") : __("Proceed to attend")}
						</button>
					</td>
				</tr>`;
			})
			.join("");

		this.table_host.html(`
			<p class="text-muted small mb-2">${__("{0} patient(s) in queue", [rows.length])}</p>
			<table class="table table-bordered table-hover">
				<thead>
					<tr>
						<th>${__("Queue #")}</th>
						<th>${__("Patient")}</th>
						<th>${__("UPID")}</th>
						<th>${__("Priority")}</th>
						<th>${__("Status")}</th>
						<th>${__("Service")}</th>
						<th>${__("Alert")}</th>
						<th></th>
					</tr>
				</thead>
				<tbody>${body}</tbody>
			</table>
		`);

		this.table_host.find(".btn-attend").on("click", (e) => {
			const enc = $(e.currentTarget).attr("data-encounter");
			frappe.call({
				method: "healthcare.healthcare.rwanda_opd.start_consultation",
				args: { encounter: enc },
				freeze: true,
				callback: () => frappe.set_route("Form", "Patient Encounter", enc),
			});
		});
	}
}
