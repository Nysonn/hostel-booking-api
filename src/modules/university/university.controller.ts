import { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import * as service from "./university.service";

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.getMe(req.userContext!.user.id);
    res.json({ success: true, message: "Profile fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { clerkId, user } = req.userContext!;
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
    const { user, landlord } = await service.registerLandlord(req.userContext!.user.id, req.body as import("./university.schema").CreateLandlordInput);
    res.status(201).json({
      success: true,
      message: "Landlord registered successfully",
      data: {
        landlordCode: landlord.landlordCode,
        id: landlord.id,
        userId: user.id,
        universityId: landlord.universityId,
        fullName: landlord.fullName,
        gender: landlord.gender,
        email: landlord.email,
        whatsappNumber: landlord.whatsappNumber,
        maritalStatus: landlord.maritalStatus,
        nin: landlord.nin,
        createdAt: landlord.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getLandlords: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listLandlords(req.userContext!.user.id);
    res.json({ success: true, message: "Landlords fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getStudents: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listStudents(req.userContext!.user.id);
    res.json({ success: true, message: "Students fetched successfully", data });
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

export const suspendLandlord: RequestHandler = async (req, res, next) => {
  try {
    await service.suspendLandlord(
      req.userContext!.user.id,
      String(req.params.userId)
    );
    res.json({ success: true, message: "Landlord suspended successfully", data: null });
  } catch (err) {
    next(err);
  }
};

export const unsuspendLandlord: RequestHandler = async (req, res, next) => {
  try {
    await service.unsuspendLandlord(
      req.userContext!.user.id,
      String(req.params.userId)
    );
    res.json({ success: true, message: "Landlord reactivated successfully", data: null });
  } catch (err) {
    next(err);
  }
};
