import { Router } from "express";
import {
	addFavoCompany,
	createCompany,
	deleteCompany,
	deleteFavoCompany,
	getCompanies,
	getFavoCompanies,
} from "../controllers/companies.controller";
import { authenticate, requireRole } from "../middleware/auth";

const companiesRouter = Router();

companiesRouter
	.route("/")
	.get(authenticate, getCompanies)
	.post(authenticate, createCompany);

companiesRouter
	.route("/:company_id")
	.delete(authenticate, requireRole(["teacher"]), deleteCompany);

companiesRouter
	.route("/favorite")
	.post(authenticate, requireRole(["teacher"]), addFavoCompany);

companiesRouter
	.route("/favorite")
	.get(authenticate, requireRole(["teacher"]), getFavoCompanies)
	.put(authenticate, requireRole(["teacher"]), deleteFavoCompany);

export default companiesRouter;
