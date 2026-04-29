import { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import * as service from "./landlord.service";

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { clerkId, user } = req.userContext!;
    await service.resetPassword(clerkId, user.id, req.body.new_password as string);
    res.json({ success: true, message: "Password updated successfully", data: null });
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

export const createHostel: RequestHandler = async (req, res, next) => {
  try {
    const files = (req.files ?? []) as Express.Multer.File[];
    const data = await service.addHostel(
      req.userContext!.user.id,
      req.body as import("./landlord.schema").CreateHostelInput,
      files
    );
    res.status(201).json({ success: true, message: "Hostel created successfully", data });
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

export const createRoom: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.addRoom(
      req.userContext!.user.id,
      String(req.params.hostelId),
      req.body as import("./landlord.schema").CreateRoomInput
    );
    res.status(201).json({ success: true, message: "Room created successfully", data });
  } catch (err) {
    next(err);
  }
};

export const updateRoom: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.modifyRoom(
      req.userContext!.user.id,
      String(req.params.hostelId),
      String(req.params.roomId),
      req.body as import("./landlord.schema").UpdateRoomInput
    );
    res.json({ success: true, message: "Room updated successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getNotifications: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listNotifications(req.userContext!.user.id);
    res.json({ success: true, message: "Notifications fetched successfully", data });
  } catch (err) {
    next(err);
  }
};
