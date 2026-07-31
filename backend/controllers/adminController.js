import validator from "validator"
import bycrypt from 'bcrypt'
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import specialityModel from "../models/specialityModel.js";
import staffModel from "../models/staffModel.js";
import sessionModel from "../models/sessionModel.js";

// Inclusive lower-bound Date for the "Period" dropdown filter (speciality/doctor-performance/
// cancel-rate reports) — 'all' (or anything unrecognised) returns null, meaning no lower bound.
const getPeriodStartDate = (period) => {
  const now = new Date()
  switch (period) {
    case '7d': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    case '1m': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case '3m': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case '12m': return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
    default: return null
  }
}

const slotDateToDate = (slotDate) => {
  const [d, m, y] = slotDate.split('_').map(Number)
  return new Date(y, m - 1, d)
}

// API for adding doctor
const addDoctor = async (req, res) => {

  try {

    const { name, email, password, gender, registrationNumber, speciality, degree, experience, about, fees, address, governmentHospital } = req.body
    const imageFile = req.file

    // console.log({ name, email, password, gender, registrationNumber, speciality, degree, experience, about, fees, address },imageFile);

    // Checking for all data to add doctor
    if (!name || !email || !password || !gender || !registrationNumber || !speciality || !degree || !experience) {
      return res.json({ success: false, message: "Missing Details" })
    }

    // Validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a vaild email" })
    }

    // Validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password" })
    }


    // Hashign doctor password
    const salt = await bycrypt.genSalt(10)
    const hashedPassword = await bycrypt.hash(password, salt)

    // Use local image path (uploaded by multer), if a file was provided
    const imagePath = req.file ? `/uploads/${req.file.filename}` : "" // e.g., "uploads/1710000000-dr.jpg"

    const doctorData = {
      name,
      email,
      image: imagePath,
      password: hashedPassword,
      gender,
      registrationNumber,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      governmentHospital: governmentHospital || "",
      date: Date.now()
    }

    const newDoctor = new doctorModel(doctorData)
    await newDoctor.save()

    res.json({ success: true, message: "Doctor Added" })


  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password')
    res.json({ success: true, doctors })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {

    const appointments = await appointmentModel.find({})
    res.json({ success: true, appointments })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

// API for admin to get no-show appointments across all doctors
// A no-show is a paid appointment in a session that has started and ended,
// but was never marked completed (patient never came in)
const getNoShowsAdmin = async (req, res) => {
  try {

    const appointments = await appointmentModel.find({
      payment: true,
      isCompleted: false,
      cancelled: false,
      sessionId: { $ne: null }
    }).populate('sessionId')

    const noShows = appointments.filter(item => item.sessionId?.sessionStart && item.sessionId?.sessionEnd)

    res.json({ success: true, noShows })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {

    const { appointmentId } = req.body
    const appointmentData = await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    // releasing session slot, if this appointment belonged to a session
    if (appointmentData?.sessionId) {
      await sessionModel.findByIdAndUpdate(appointmentData.sessionId, {
        $pull: { appointments: appointmentData._id },
        $inc: { bookedPatientsCount: -1 }
      })
    }

    res.json({ success: true, message: 'Appointment Cancelled' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

// API for admin to view the appointments belonging to a single session (read-only)
const getSessionAppointmentsAdmin = async (req, res) => {
  try {

    const { sessionId } = req.params

    const session = await sessionModel.findById(sessionId).populate('appointments')

    if (!session) {
      return res.json({ success: false, message: 'Session not found' })
    }

    res.json({ success: true, session, appointments: session.appointments })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get all doctor sessions for admin, with per-session earnings summed from paid & completed appointments only
const sessionsAdmin = async (req, res) => {
  try {

    const sessions = await sessionModel.find({}).sort({ date: 1, startTime: 1 }).populate('appointments')

    const sessionsWithEarnings = sessions.map(session => {
      const { appointments, ...sessionObj } = session.toObject()
      const earnings = appointments
        .filter(appt => appt.payment && appt.isCompleted)
        .reduce((sum, appt) => sum + appt.amount, 0)

      return { ...sessionObj, appointments, earnings }
    })

    res.json({ success: true, sessions: sessionsWithEarnings })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get an all-time, per-doctor summary of sessions and earnings/profit for admin.
// Total is always Upcoming + Complete + Cancel (mutually exclusive, exhaustive) — a session is:
//  - Complete, if it was actually ended (sessionEnd)
//  - Cancel, if explicitly cancelled, OR its date has already passed without ever starting/ending
//    (the doctor never held it — same "lapsed session" rule SessionHistory.jsx applies per-session,
//    folded into Cancel here since this summary only has one bucket for "didn't happen")
//  - Upcoming, otherwise (today or a future date, not yet started)
// Earnings/profit mirror sessionsAdmin/adminDashboard: sum of amount on paid & completed
// appointments, profit = earnings - doctor fees.
const sessionReportAdmin = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('name')
    const sessions = await sessionModel.find({}).populate('appointments')

    const now = new Date()
    const todayUTCms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

    const report = doctors.map(doctor => {
      const doctorSessions = sessions.filter(session => String(session.doctorId) === String(doctor._id))

      let earnings = 0
      let profit = 0
      let upcomingSessions = 0
      let completeSessions = 0
      let cancelSessions = 0

      doctorSessions.forEach(session => {
        const sessionDayMs = new Date(session.date).setUTCHours(0, 0, 0, 0)
        const isPast = sessionDayMs < todayUTCms

        if (session.status === 'cancelled') {
          cancelSessions++
        } else if (session.sessionEnd) {
          completeSessions++
        } else if (isPast) {
          cancelSessions++
        } else {
          upcomingSessions++
        }

        session.appointments
          .filter(appt => appt.payment && appt.isCompleted)
          .forEach(appt => {
            earnings += appt.amount
            profit += appt.amount - (appt.docData?.fees || 0)
          })
      })

      return {
        doctorId: doctor._id,
        doctorName: doctor.name,
        totalSessions: doctorSessions.length,
        upcomingSessions,
        completeSessions,
        cancelSessions,
        earnings,
        profit
      }
    })

    res.json({ success: true, report })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get an all-time, per-doctor summary of appointments and earnings/profit for admin.
// Upcoming = not cancelled & not completed, Complete = isCompleted.
// Cancel is intentionally scoped to cancelled AND paid appointments only — cancelled bookings
// that were never paid (abandoned before payment completed) are excluded on purpose, so
// Total is NOT guaranteed to equal Upcoming + Complete + Cancel; the gap is that
// never-paid-then-cancelled group, tracked as a real but separate category (confirmed).
// Earnings/profit mirror sessionReportAdmin/adminDashboard: sum of amount on paid & completed
// appointments, profit = earnings - doctor fees.
const appointmentReportAdmin = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('name')
    const appointments = await appointmentModel.find({})

    const report = doctors.map(doctor => {
      const doctorAppointments = appointments.filter(appt => appt.docId === String(doctor._id))

      let earnings = 0
      let profit = 0
      let upcomingAppointments = 0
      let completeAppointments = 0
      let cancelAppointments = 0

      doctorAppointments.forEach(appt => {
        if (!appt.cancelled && !appt.isCompleted) upcomingAppointments++
        if (appt.isCompleted) completeAppointments++
        if (appt.cancelled && appt.payment) cancelAppointments++

        if (appt.payment && appt.isCompleted) {
          earnings += appt.amount
          profit += appt.amount - (appt.docData?.fees || 0)
        }
      })

      return {
        doctorId: doctor._id,
        doctorName: doctor.name,
        totalAppointments: doctorAppointments.length,
        upcomingAppointments,
        completeAppointments,
        cancelAppointments,
        earnings,
        profit
      }
    })

    res.json({ success: true, report })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get a per-doctor cancel-rate summary for admin, scoped to the requested period
// (req.query.period — see getPeriodStartDate; defaults to all-time when omitted/'all').
// Cancel Appointment % = paid cancelled appointments / (complete + paid cancelled) * 100 —
//   same paid-only cancel rule as appointmentReportAdmin (unpaid/never-paid cancellations excluded).
// Cancel Session % = cancelled sessions / (complete + cancelled) * 100, scoped to sessions that
//   had at least one appointment ever booked on them — sessions nobody ever booked into are
//   excluded entirely (both from the complete and cancel buckets), and future not-yet-held
//   sessions are excluded from the ratio too (same complete/cancel/lapsed rules as sessionReportAdmin).
const cancelRateReportAdmin = async (req, res) => {
  try {
    const periodStart = getPeriodStartDate(req.query.period)

    const doctors = await doctorModel.find({}).select('name')
    const appointments = await appointmentModel.find({})
    const sessions = await sessionModel.find({}).populate('appointments')

    const now = new Date()
    const todayUTCms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

    const report = doctors.map(doctor => {
      const doctorAppointments = appointments.filter(appt =>
        appt.docId === String(doctor._id) && (!periodStart || slotDateToDate(appt.slotDate) >= periodStart)
      )
      const doctorSessions = sessions.filter(session =>
        String(session.doctorId) === String(doctor._id) && session.appointments.length > 0 &&
        (!periodStart || new Date(session.date) >= periodStart)
      )

      let completeAppointments = 0
      let cancelAppointments = 0
      doctorAppointments.forEach(appt => {
        if (appt.isCompleted) completeAppointments++
        if (appt.cancelled && appt.payment) cancelAppointments++
      })

      let completeSessions = 0
      let cancelSessions = 0
      doctorSessions.forEach(session => {
        const sessionDayMs = new Date(session.date).setUTCHours(0, 0, 0, 0)
        const isPast = sessionDayMs < todayUTCms

        if (session.status === 'cancelled') {
          cancelSessions++
        } else if (session.sessionEnd) {
          completeSessions++
        } else if (isPast) {
          cancelSessions++
        }
        // future, not-yet-held sessions are left out of both buckets
      })

      const appointmentDenom = completeAppointments + cancelAppointments
      const sessionDenom = completeSessions + cancelSessions

      return {
        doctorId: doctor._id,
        doctorName: doctor.name,
        cancelAppointmentRate: appointmentDenom > 0 ? (cancelAppointments / appointmentDenom) * 100 : 0,
        cancelSessionRate: sessionDenom > 0 ? (cancelSessions / sessionDenom) * 100 : 0
      }
    })

    res.json({ success: true, report })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get a per-speciality summary of doctor counts and earnings/profit for admin, with
// earnings/profit scoped to the requested period (req.query.period — see getPeriodStartDate;
// defaults to all-time when omitted/'all'). Doctor count is a live headcount, not period-scoped.
// Earnings/profit mirror appointmentReportAdmin/sessionReportAdmin/adminDashboard: sum of amount
// on paid & completed appointments, matched to a speciality via docData.speciality (same field
// getAppointmentsBySpecialty groups by), profit = earnings - doctor fees.
const specialityReportAdmin = async (req, res) => {
  try {
    const periodStart = getPeriodStartDate(req.query.period)

    const specialities = await specialityModel.find({}).select('speciality')
    const doctors = await doctorModel.find({}).select('speciality')
    let appointments = await appointmentModel.find({ payment: true, isCompleted: true })
    if (periodStart) appointments = appointments.filter(appt => slotDateToDate(appt.slotDate) >= periodStart)

    const report = specialities.map(item => {
      const name = item.speciality

      const doctorCount = doctors.filter(doc => doc.speciality === name).length

      let earnings = 0
      let profit = 0
      appointments
        .filter(appt => appt.docData?.speciality === name)
        .forEach(appt => {
          earnings += appt.amount
          profit += appt.amount - (appt.docData?.fees || 0)
        })

      return {
        specialityId: item._id,
        specialityName: name,
        doctorCount,
        earnings,
        profit
      }
    })

    res.json({ success: true, report })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get a per-doctor performance summary for admin: doctor's own fee revenue vs the
// hospital's cut, on paid & completed appointments, scoped to the requested period
// (req.query.period — see getPeriodStartDate; defaults to all-time when omitted/'all').
// Earnings = sum of docData.fees (the doctor's fee, snapshotted per appointment) — what the
// doctor themself earned, not the total the patient paid.
// Profit = sum of (amount - docData.fees) — the hospital's channeling-fee cut, same rule as
// appointmentReportAdmin/specialityReportAdmin's profit.
const doctorPerformanceAdmin = async (req, res) => {
  try {
    const periodStart = getPeriodStartDate(req.query.period)

    const doctors = await doctorModel.find({}).select('name speciality')
    let appointments = await appointmentModel.find({ payment: true, isCompleted: true })
    if (periodStart) appointments = appointments.filter(appt => slotDateToDate(appt.slotDate) >= periodStart)

    const report = doctors.map(doctor => {
      let earnings = 0
      let profit = 0
      let completedAppointments = 0

      appointments
        .filter(appt => appt.docId === String(doctor._id))
        .forEach(appt => {
          const fee = appt.docData?.fees || 0
          earnings += fee
          profit += appt.amount - fee
          completedAppointments++
        })

      return {
        doctorId: doctor._id,
        doctorName: doctor.name,
        speciality: doctor.speciality,
        completedAppointments,
        earnings,
        profit
      }
    })

    res.json({ success: true, report })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const adminDashboard = async (req, res) => {
  try {
    // Current-month boundaries in the server's local time (not UTC — Mongo's $year/$month
    // aggregation operators default to UTC, which drifts from "this month" near month-start
    // in timezones ahead of UTC like ours). Using plain instant ranges keeps every
    // month-scoped query below agreeing on the same boundary.
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS months are 0-based; slotDate months are 1-based
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfMonthMs = startOfMonth.getTime();
    const startOfNextMonthMs = startOfNextMonth.getTime();

    // Doctor headcounts (live status, not month-scoped)
    const doctorsCount = await doctorModel.countDocuments({});
    const availableDoctorsCount = await doctorModel.countDocuments({ available: true });

    // Appointment-based stats. Counts (total/completed/cancelled/upcoming/patients) are scoped
    // by slotDate — the appointment's actual scheduled date — so a September appointment
    // booked in July shows up under September, not July. Money figures (earnings/fees/refunds)
    // are scoped by `date` — when the payment/refund happened — since that's cash flow, not schedule.
    const [appointmentStats] = await appointmentModel.aggregate([
      {
        $addFields: {
          slotDateParts: { $split: ["$slotDate", "_"] }
        }
      },
      {
        $addFields: {
          slotMonth: { $toInt: { $arrayElemAt: ["$slotDateParts", 1] } },
          slotYear: { $toInt: { $arrayElemAt: ["$slotDateParts", 2] } }
        }
      },
      {
        $facet: {
          total: [
            { $match: { slotYear: currentYear, slotMonth: currentMonth } },
            { $count: "count" }
          ],
          completed: [
            { $match: { slotYear: currentYear, slotMonth: currentMonth, isCompleted: true } },
            { $count: "count" }
          ],
          cancelled: [
            { $match: { slotYear: currentYear, slotMonth: currentMonth, cancelled: true } },
            { $count: "count" }
          ],
          upcoming: [
            { $match: { slotYear: currentYear, slotMonth: currentMonth, cancelled: false, isCompleted: false } },
            { $count: "count" }
          ],
          patients: [
            { $match: { slotYear: currentYear, slotMonth: currentMonth } },
            { $group: { _id: "$userId" } },
            { $count: "count" }
          ],
          // Cancel rate follows the same paid-only cancel rule as cancelRateReportAdmin/
          // appointmentReportAdmin (unpaid/never-paid cancellations excluded) — see
          // cancelAppointmentRate above — just scoped to this month instead of all-time.
          cancelledPaid: [
            { $match: { slotYear: currentYear, slotMonth: currentMonth, cancelled: true, payment: true } },
            { $count: "count" }
          ],
          earnings: [
            { $match: { date: { $gte: startOfMonthMs, $lt: startOfNextMonthMs }, payment: true, refundPayment: { $ne: true } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          doctorFees: [
            { $match: { date: { $gte: startOfMonthMs, $lt: startOfNextMonthMs }, payment: true, refundPayment: { $ne: true } } },
            { $group: { _id: null, total: { $sum: "$docData.fees" } } }
          ],
          refunds: [
            { $match: { date: { $gte: startOfMonthMs, $lt: startOfNextMonthMs }, refundPayment: true } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ]
        }
      }
    ]);

    const pick = (facetResult) => facetResult?.[0]?.count ?? 0;
    const pickSum = (facetResult) => facetResult?.[0]?.total ?? 0;

    const earningsThisMonth = pickSum(appointmentStats.earnings);
    const doctorFeesThisMonth = pickSum(appointmentStats.doctorFees);

    // Session-based stats, scoped to sessions scheduled this month.
    // sessionModel.date is a real BSON Date, so compare against Date boundaries (not epoch-ms
    // numbers, which don't sort correctly against a Date field in an aggregation $match).
    const [sessionStats] = await sessionModel.aggregate([
      { $match: { date: { $gte: startOfMonth, $lt: startOfNextMonth } } },
      {
        $facet: {
          total: [{ $count: "count" }],
          completed: [{ $match: { sessionEnd: true } }, { $count: "count" }],
          upcoming: [{ $match: { status: "active", sessionStart: false } }, { $count: "count" }],
          cancelled: [{ $match: { status: "cancelled" } }, { $count: "count" }]
        }
      }
    ]);

    // Kept for the "Latest Bookings" list further down the dashboard, scoped to this month
    const latestAppointments = await appointmentModel
      .find({ date: { $gte: startOfMonthMs, $lt: startOfNextMonthMs } })
      .sort({ date: -1 })
      .limit(5);

    const completedAppointmentsThisMonth = pick(appointmentStats.completed);
    const cancelledPaidAppointmentsThisMonth = pick(appointmentStats.cancelledPaid);
    const cancelRateDenom = completedAppointmentsThisMonth + cancelledPaidAppointmentsThisMonth;

    const dashData = {
      doctors: doctorsCount,
      availableDoctors: availableDoctorsCount,

      patientsThisMonth: pick(appointmentStats.patients),
      totalAppointmentsThisMonth: pick(appointmentStats.total),
      completedAppointmentsThisMonth,
      upcomingAppointmentsThisMonth: pick(appointmentStats.upcoming),
      cancelledAppointmentsThisMonth: pick(appointmentStats.cancelled),
      cancelRateThisMonth: cancelRateDenom > 0 ? (cancelledPaidAppointmentsThisMonth / cancelRateDenom) * 100 : 0,

      sessionsThisMonth: pick(sessionStats.total),
      completedSessionsThisMonth: pick(sessionStats.completed),
      upcomingSessionsThisMonth: pick(sessionStats.upcoming),
      cancelledSessionsThisMonth: pick(sessionStats.cancelled),

      earningsThisMonth,
      doctorFeesThisMonth,
      profitThisMonth: earningsThisMonth - doctorFeesThisMonth,

      refundsThisMonth: pickSum(appointmentStats.refunds),

      latestAppointments
    };

    res.json({ success: true, dashData });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


const getMonthlyRevenue = async (req, res) => {
  try {
    const result = await appointmentModel.aggregate([
      { $match: { payment: true, isCompleted: true } },
      {
        $addFields: {
          createdAtDate: { $toDate: "$date" }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAtDate" },
            month: { $month: "$createdAtDate" }
          },
          totalRevenue: { $sum: "$amount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Create a map from aggregation result keyed by "year-month"
    const revenueMap = new Map();
    result.forEach(item => {
      const year = item._id.year;
      const month = item._id.month;
      revenueMap.set(`${year}-${month}`, item.totalRevenue); // <-- fix here: backticks for template literal
    });

    const year = new Date().getFullYear();
    const monthsToShow = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // All 12 months

    // Build the full array with zeros for missing months
    const formatted = monthsToShow.map(month => {
      return {
        name: `${monthNames[month - 1]} `,               // <-- fix here: backticks for template literal
        revenue: revenueMap.get(`${year}-${month}`) || 0         // <-- fix here: backticks for template literal
      };
    });

    res.json({ success: true, monthlyRevenue: formatted });
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get appointment counts grouped by doctor specialty, for the current month
const getAppointmentsBySpecialty = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // slotDate months are 1-based

    // Fetch completed, paid, and not cancelled appointments, then keep only those
    // actually scheduled (slotDate) for this month
    const appointments = (await appointmentModel.find({
      cancelled: false,
      payment: true,
      isCompleted: true,
    })).filter(appointment => {
      const [, month, year] = appointment.slotDate.split('_').map(Number)
      return year === currentYear && month === currentMonth
    });

    // Group counts by specialty from docData.speciality
    const specialtyCounts = appointments.reduce((acc, appointment) => {
      const specialty =
        appointment.docData && appointment.docData.speciality
          ? appointment.docData.speciality
          : 'Unknown';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    // Convert to array suitable for pie chart [{ name: 'Specialty', value: count }]
    const pieChartData = Object.entries(specialtyCounts).map(([name, value]) => ({
      name,
      value,
    }));

    res.status(200).json({ success: true, data: pieChartData });
  } catch (error) {
    console.error('Error fetching appointments by specialty:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Controller to get appointment counts grouped by booking channel (online vs walk-in) for the current month
const getAppointmentsByChannel = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // slotDate months are 1-based

    const appointments = await appointmentModel.aggregate([
      {
        $addFields: {
          slotDateParts: { $split: ["$slotDate", "_"] }
        }
      },
      {
        $addFields: {
          slotMonth: { $toInt: { $arrayElemAt: ["$slotDateParts", 1] } },
          slotYear: { $toInt: { $arrayElemAt: ["$slotDateParts", 2] } }
        }
      },
      {
        $match: {
          cancelled: false,
          payment: true,
          isCompleted: true,
          slotYear: currentYear,
          slotMonth: currentMonth,
        }
      },
      {
        $group: {
          _id: "$isWalkIn",
          count: { $sum: 1 }
        }
      }
    ]);

    const onlineCount = appointments.find(item => item._id !== true)?.count ?? 0;
    const offlineCount = appointments.find(item => item._id === true)?.count ?? 0;

    const pieChartData = [
      { name: 'Online', value: onlineCount },
      { name: 'Walk-in', value: offlineCount },
    ];

    res.status(200).json({ success: true, data: pieChartData });
  } catch (error) {
    console.error('Error fetching appointments by channel:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.json({ success: false, message: "Doctor ID is required" });
    }

    // const appointments = await appointmentModel.find({ docId })
    const appointments = await appointmentModel.find({ docId: doctorId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// API to get all specialities
const getSpecialities = async (req, res) => {
  try {
    const specialities = await specialityModel.find({})
    res.json({ success: true, specialities })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API for add speciality
const addSpeciality = async (req, res) => {
  try {
    const { speciality, channelingFee } = req.body

    if (!speciality || !channelingFee) {
      return res.json({ success: false, message: "Speciality name and channeling fee are required" })
    }

    if (!req.file) {
      return res.json({ success: false, message: "Speciality image is required" })
    }

    const imagePath = `/uploads/${req.file.filename}`

    const newSpeciality = new specialityModel({
      speciality,
      image: imagePath,
      channelingFee: Number(channelingFee)
    })

    await newSpeciality.save()

    res.json({ success: true, message: "Speciality Added" })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


// API for edit speciality
const editSpeciality = async (req, res) => {
  try {
    const { id } = req.params
    const { speciality, channelingFee } = req.body

    if (!speciality || !channelingFee) {
      return res.json({ success: false, message: "Speciality name and channeling fee are required" })
    }

    const updateData = {
      speciality,
      channelingFee: Number(channelingFee)
    }

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`
    }

    const updated = await specialityModel.findByIdAndUpdate(id, updateData, { new: true })

    if (!updated) {
      return res.json({ success: false, message: "Speciality not found" })
    }

    res.json({ success: true, message: "Speciality Updated" })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API for adding staff (admin or receptionist)
const addStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.json({ success: false, message: "All fields are required" })
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" })
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters" })
    }

    if (!['admin', 'receptionist'].includes(role)) {
      return res.json({ success: false, message: "Role must be admin or receptionist" })
    }

    const existing = await staffModel.findOne({ email })
    if (existing) {
      return res.json({ success: false, message: "Email already in use" })
    }

    const salt = await bycrypt.genSalt(10)
    const hashedPassword = await bycrypt.hash(password, salt)

    const newStaff = new staffModel({ name, email, password: hashedPassword, role })
    await newStaff.save()

    res.json({ success: true, message: `${role.charAt(0).toUpperCase() + role.slice(1)} added successfully` })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API for the currently logged-in admin to fetch their own profile
const getMyProfile = async (req, res) => {
  try {
    const { adminId } = req.body

    if (adminId === 'superadmin') {
      return res.json({ success: true, profile: { name: 'Admin', email: process.env.ADMIN_EMAIL, isSuperAdmin: true } })
    }

    const staff = await staffModel.findById(adminId).select('-password')
    if (!staff) {
      return res.json({ success: false, message: 'Account not found' })
    }

    res.json({ success: true, profile: { name: staff.name, email: staff.email, isSuperAdmin: false } })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API for the currently logged-in admin to update their own name
// Email is fixed (it's the login identifier) and isn't editable here
const updateMyProfile = async (req, res) => {
  try {
    const { adminId, name } = req.body

    if (adminId === 'superadmin') {
      return res.json({ success: false, message: 'The default admin account is configured via environment settings and cannot be edited here' })
    }

    if (!name) {
      return res.json({ success: false, message: 'Name is required' })
    }

    const updated = await staffModel.findByIdAndUpdate(adminId, { name }, { new: true }).select('-password')
    if (!updated) {
      return res.json({ success: false, message: 'Account not found' })
    }

    res.json({ success: true, message: 'Profile updated successfully', profile: { name: updated.name, email: updated.email, isSuperAdmin: false } })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API for the currently logged-in admin to change their own password
const changeMyPassword = async (req, res) => {
  try {
    const { adminId, currentPassword, newPassword } = req.body

    if (adminId === 'superadmin') {
      return res.json({ success: false, message: 'The default admin password is configured via environment settings and cannot be changed here' })
    }

    if (!currentPassword || !newPassword) {
      return res.json({ success: false, message: 'Current and new password are required' })
    }

    if (newPassword.length < 8) {
      return res.json({ success: false, message: 'New password must be at least 8 characters' })
    }

    const staff = await staffModel.findById(adminId)
    if (!staff) {
      return res.json({ success: false, message: 'Account not found' })
    }

    const isMatch = await bycrypt.compare(currentPassword, staff.password)
    if (!isMatch) {
      return res.json({ success: false, message: 'Current password is incorrect' })
    }

    const salt = await bycrypt.genSalt(10)
    staff.password = await bycrypt.hash(newPassword, salt)
    await staff.save()

    res.json({ success: true, message: 'Password changed successfully' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get all staff
const getStaff = async (req, res) => {
  try {
    const staff = await staffModel.find({}).select('-password')
    res.json({ success: true, staff })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to delete a staff member (admin accounts cannot be deleted, only receptionists)
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params

    const staffMember = await staffModel.findById(id)
    if (!staffMember) {
      return res.json({ success: false, message: "Staff member not found" })
    }

    if (staffMember.role === 'admin') {
      return res.json({ success: false, message: "Admin accounts cannot be deleted" })
    }

    await staffModel.findByIdAndDelete(id)

    res.json({ success: true, message: "Staff member deleted successfully" })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to update a staff member's name and email
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email } = req.body

    if (!name || !email) {
      return res.json({ success: false, message: "Name and email are required" })
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" })
    }

    const existing = await staffModel.findOne({ email, _id: { $ne: id } })
    if (existing) {
      return res.json({ success: false, message: "Email already in use" })
    }

    const updated = await staffModel.findByIdAndUpdate(id, { name, email }, { new: true }).select('-password')
    if (!updated) {
      return res.json({ success: false, message: "Staff member not found" })
    }

    res.json({ success: true, message: "Staff member updated successfully", staff: updated })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get a single doctor by ID (for admin edit form)
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params
    const doctor = await doctorModel.findById(id).select('-password')
    if (!doctor) return res.json({ success: false, message: 'Doctor not found' })
    res.json({ success: true, doctor })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to update a doctor's profile by admin
const updateDoctorById = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, registrationNumber, speciality, gender, experience, fees, degree, address, about, governmentHospital } = req.body

    const updateData = {
      name,
      email,
      registrationNumber,
      speciality,
      gender,
      experience,
      fees: Number(fees),
      degree,
      address: JSON.parse(address),
      about,
      governmentHospital: governmentHospital || ''
    }

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`
    }

    const updated = await doctorModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password')
    if (!updated) return res.json({ success: false, message: 'Doctor not found' })

    res.json({ success: true, message: 'Doctor profile updated', doctor: updated })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { addDoctor, allDoctors, appointmentsAdmin, getNoShowsAdmin, appointmentCancel, sessionsAdmin, getSessionAppointmentsAdmin, sessionReportAdmin, appointmentReportAdmin, cancelRateReportAdmin, specialityReportAdmin, doctorPerformanceAdmin, adminDashboard, getMonthlyRevenue, getAppointmentsBySpecialty, getAppointmentsByChannel, addSpeciality, getSpecialities, editSpeciality, addStaff, getStaff, deleteStaff, updateStaff, getDoctorById, updateDoctorById, getMyProfile, updateMyProfile, changeMyPassword }