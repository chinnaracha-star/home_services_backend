import { query } from "../configs/db.mjs";
import { supabase } from "../configs/supabase.mjs";

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // get data from database where email equals to the email from request body
    const result = await query(
      `
        SELECT email
        FROM users
        WHERE email = $1
        `,
      [email],
    );

    // if the result is empty, then register the user, otherwise login the user
    if (result.rows.length === 0) {
      await supabase.auth.signUp({ email, password });
      res.status(200).json({
        message: "register successfully",
      });
    } else {
      const { data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      res.status(200).json({
        message: "login successfully",
        data: data,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server connection error",
    });
  }
}

export async function logout(req, res) {
  try {
    await supabase.auth.signOut();
    res.status(200).json({
      message: "logout successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server connection error",
    });
  }
}
