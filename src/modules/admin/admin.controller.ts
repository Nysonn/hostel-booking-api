import { RequestHandler } from "express";
import { getUsersQuerySchema, createUniversitySchema, adminLoginSchema } from "./admin.schema";
import * as service from "./admin.service";

export const login: RequestHandler = async (req, res, next) => {
  try {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    const data = await service.loginAdmin(parsed.data);
    res.json({ success: true, message: "Login successful", data });
  } catch (err) {
    next(err);
  }
};

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.getMe(req.userContext!.user.id);
    res.json({ success: true, message: "Profile fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers: RequestHandler = async (req, res, next) => {
  try {
    const parsed = getUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    const data = await service.getUsersList(parsed.data.role);
    res.json({ success: true, message: "Users fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getUniversities: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.getUniversitiesList();
    res.json({
      success: true,
      message: "Universities fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getLandlords: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.getLandlordsList();
    res.json({
      success: true,
      message: "Landlords fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getStudents: RequestHandler = async (_req, res, next) => {
  try {
    const data = await service.getStudentsList();
    res.json({
      success: true,
      message: "Students fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const suspendUser: RequestHandler = async (req, res, next) => {
  try {
    await service.suspendUser(String(req.params.userId));
    res.json({ success: true, message: "User suspended successfully", data: null });
  } catch (err) {
    next(err);
  }
};

export const unsuspendUser: RequestHandler = async (req, res, next) => {
  try {
    await service.unsuspendUser(String(req.params.userId));
    res.json({
      success: true,
      message: "User reactivated successfully",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    await service.removeUser(String(req.params.userId));
    res.json({ success: true, message: "User deleted successfully", data: null });
  } catch (err) {
    next(err);
  }
};

export const createUniversity: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.addUniversity(req.body);
    res.status(201).json({
      success: true,
      message: "University created successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};
