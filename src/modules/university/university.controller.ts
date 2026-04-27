import { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import * as service from "./university.service";

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { clerkId, user } = req.auth!;
    await service.resetPassword(clerkId, user.id, req.body.new_password as string);
    res.json({
      success: true,
      message: "Password updated successfully",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const { sessionId } = getAuth(req);
    if (!sessionId) {
      res.status(401).json({ success: false, message: "No active session found" });
      return;
    }
    await service.logout(sessionId);
    res.json({ success: true, message: "Logged out successfully", data: null });
  } catch (err) {
    next(err);
  }
};

export const createLandlord: RequestHandler = async (req, res, next) => {
  try {
    const files = (req.files ?? []) as Express.Multer.File[];
    const data = await service.registerLandlord(req.auth!.user.id, req.body as import("./university.schema").CreateLandlordInput, files);
    res.status(201).json({
      success: true,
      message: "Landlord registered successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getLandlords: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listLandlords(req.auth!.user.id);
    res.json({ success: true, message: "Landlords fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getStudents: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listStudents(req.auth!.user.id);
    res.json({ success: true, message: "Students fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getHostels: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listHostels(req.auth!.user.id);
    res.json({ success: true, message: "Hostels fetched successfully", data });
  } catch (err) {
    next(err);
  }
};
