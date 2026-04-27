import { RequestHandler } from "express";
import * as service from "./payment.service";

export const createPayment: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.processBookingPayment(
      req.auth!.user.id,
      String(req.params.bookingId),
      req.body as import("./payment.schema").CreatePaymentInput
    );
    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getPayments: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.listPayments(
      req.auth!.user.id,
      String(req.params.bookingId)
    );
    res.json({
      success: true,
      message: "Payments fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};
