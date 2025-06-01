import { useAuth } from "@clerk/clerk-expo";
import { createClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";


const supabaseURL= process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseURL || !supabaseKey) {
  throw new Error("Supabase URL and Anon Key must be provided");
}
/*
export const supabase=createClient(supabaseURL,supabaseKey,
   /* {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl:false,
   
} }*/


 //   )

    export const useSupabase=()=>{
      const {getToken} = useAuth();
      return createClient(supabaseURL,supabaseKey,{

        accessToken:async()=>getToken()??null
      })
    }
