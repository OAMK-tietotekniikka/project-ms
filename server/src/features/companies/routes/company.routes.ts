import { Router } from "express";
import {
	addFavoriteCompany,
	createCompany,
	deleteCompany,
	removeFavoriteCompany,
	listCompanies,
	listFavoriteCompanies,
} from "../controllers/companies.controller";
import { authenticate, requireRole } from "../../../shared/middleware/auth";

const companiesRouter = Router();

// Companies collection
companiesRouter
	.route("/")
	.get(authenticate, listCompanies)
	.post(authenticate, createCompany);

// Individual company
companiesRouter
	.route("/:companyId")
	.delete(authenticate, requireRole(["teacher"]), deleteCompany);

// Favorite companies subcollection
companiesRouter
	.route("/favorites")
	.get(authenticate, requireRole(["teacher"]), listFavoriteCompanies)
	.post(authenticate, requireRole(["teacher"]), addFavoriteCompany);

// Individual favorite company
companiesRouter
	.route("/favorites/:companyId")
	.delete(authenticate, requireRole(["teacher"]), removeFavoriteCompany);

export default companiesRouter;