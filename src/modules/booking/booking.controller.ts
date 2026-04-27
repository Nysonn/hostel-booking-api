import { RequestHandler } from "express";
import * as service from "./booking.service";

export const createBooking: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.createBooking(
      req.auth!.user.id,
      req.body.room_id as string
    );
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const terminateBooking: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.terminateBooking(
      req.auth!.user.id,
      String(req.params.bookingId)
    );
    res.json({
      success: true,
      message: "Booking terminated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getBookings: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listBookings(req.auth!.user.id);
    res.json({ success: true, message: "Bookings fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getBooking: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.getSingleBooking(
      req.auth!.user.id,
      String(req.params.bookingId)
    );
    res.json({ success: true, message: "Booking fetched successfully", data });
  } catch (err) {
    next(err);
  }
};
