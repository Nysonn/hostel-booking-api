import { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import * as service from "./student.service";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.register(
      req.body as import("./student.schema").RegisterStudentInput
    );
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data,
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

export const getUniversities: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.listUniversities();
    res.json({
      success: true,
      message: "Universities fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getHostels: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listHostels(req.userContext!.user.id);
    res.json({ success: true, message: "Hostels fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getHostel: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.getHostel(
      req.userContext!.user.id,
      String(req.params.hostelId)
    );
    res.json({ success: true, message: "Hostel fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getNotifications: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listNotifications(req.userContext!.user.id);
    res.json({
      success: true,
      message: "Notifications fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};
