import validator from "validator"
import bycrypt from 'bcrypt'
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import specialityModel from "../models/specialityModel.js";
import staffModel from "../models/staffModel.js";

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
// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {

    const { appointmentId } = req.body
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    res.json({ success: true, message: 'Appointment Cancelled' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

const adminDashboard = async (req, res) => {
  try {
    // Fetch basic counts
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    // Get current year and month for filtering revenue
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS months are 0-based

    // Aggregate total revenue for current month where payment true
    const revenueResult = await appointmentModel.aggregate([
      { $match: { payment: true } },
      {
        $addFields: {
          createdAtDate: { $toDate: "$date" }  // convert your timestamp field to Date
        }
      },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$createdAtDate" }, currentYear] },
              { $eq: [{ $month: "$createdAtDate" }, currentMonth] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Build dashboard data object
    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.slice().reverse().slice(0, 5),
      totalRevenueForCurrentMonth: totalRevenue
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
      { $match: { payment: true } },
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

    const year = 2025;
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

// Controller to get appointment counts grouped by doctor specialty
const getAppointmentsBySpecialty = async (req, res) => {
  try {
    // Fetch all completed, paid, and not cancelled appointments
    const appointments = await appointmentModel.find({
      cancelled: false,
      payment: true,
      isCompleted: true,
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

export { addDoctor, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard, getMonthlyRevenue, getAppointmentsBySpecialty, addSpeciality, getSpecialities, editSpeciality, addStaff, getStaff }