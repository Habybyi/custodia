import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import * as customersService from "./customers.service.js";
import { createGarden } from "../gardens/gardens.service.js";
import * as gdprService from "./gdpr.service.js";

export const customersRouter = Router();

customersRouter.get("/", async (req, res) => {
  res.json(await customersService.listCustomers(req.query));
});

customersRouter.get("/cities", async (req, res) => {
  res.json({ cities: await customersService.listCities() });
});

customersRouter.post("/", async (req, res) => {
  res.status(201).json({ customer: await customersService.createCustomer(req.user.id, req.body) });
});

customersRouter.get("/:id", async (req, res) => {
  res.json({ customer: await customersService.getCustomer(req.params.id) });
});

customersRouter.patch("/:id", async (req, res) => {
  res.json({ customer: await customersService.updateCustomer(req.user.id, req.params.id, req.body) });
});

customersRouter.delete("/:id", requireRole("OWNER"), async (req, res) => {
  await customersService.deleteCustomer(req.user.id, req.params.id);
  res.status(204).end();
});

customersRouter.post("/:id/gardens", async (req, res) => {
  res.status(201).json({ garden: await createGarden(req.user.id, req.params.id, req.body) });
});

customersRouter.get("/:id/export", requireRole("OWNER"), async (req, res) => {
  const data = await gdprService.exportCustomer(req.user.id, req.params.id);
  res.setHeader("Content-Disposition", `attachment; filename="zakaznik-${req.params.id}.json"`);
  res.json(data);
});

