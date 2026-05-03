import { RequestHandler } from "express";
import * as service from "./analytics.service";

export const getDashboard: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.getDashboard();
    res.json({ success: true, message: "Dashboard analytics fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getOverview: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.getOverview();
    res.json({ success: true, message: "Overview fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getRevenue: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.getRevenue();
    res.json({ success: true, message: "Revenue stats fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getUniversityBreakdown: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.getUniversityBreakdown();
    res.json({ success: true, message: "University breakdown fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getRecentRegistrations: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.getRecentRegistrations();
    res.json({ success: true, message: "Recent registrations fetched successfully", data });
  } catch (err) {
    next(err);
  }
};
