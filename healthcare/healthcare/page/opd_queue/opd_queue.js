// Legacy route — redirect to Department Queue
frappe.pages["opd-queue"].on_page_load = function () {
	frappe.set_route("department-queue");
};
