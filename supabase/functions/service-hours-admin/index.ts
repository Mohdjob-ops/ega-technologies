import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
}

async function isMainAdmin(req: Request, supabase: any) {
	const header = req.headers.get("Authorization") || "";
	if (!header.startsWith("Bearer ")) return null;
	const { data: { user } } = await supabase.auth.getUser(header.slice(7));
	if (!user?.id) return null;
	const { data: admin } = await supabase
		.from("admin_users")
		.select("user_id")
		.eq("user_id", user.id)
		.eq("active", true)
		.maybeSingle();
	return admin ? user.id : null;
}

async function records(supabase: any) {
	const { data, error } = await supabase
		.from("service_hour_sessions")
		.select("*")
		.order("service_date", { ascending: false })
		.order("started_at", { ascending: false });
	if (error) throw error;

	const assistantIds = (data || [])
		.filter((item: any) => item.person_type === "assistant")
		.map((item: any) => item.person_id);
	const studentIds = (data || [])
		.filter((item: any) => item.person_type === "e8")
		.map((item: any) => item.person_id);
	const [{ data: assistants }, { data: students }] = await Promise.all([
		supabase.from("assistant_users").select("user_id, full_name, email").in("user_id", assistantIds.length ? assistantIds : ["00000000-0000-0000-0000-000000000000"]),
		supabase.from("students").select("student_id, name, email").in("student_id", studentIds.length ? studentIds : ["__none__"]),
	]);
	const people = new Map<string, { name: string; email: string }>();
	(assistants || []).forEach((person: any) => people.set(person.user_id, { name: person.full_name || person.email || person.user_id, email: person.email || "" }));
	(students || []).forEach((person: any) => people.set(person.student_id, { name: person.name || person.student_id, email: person.email || "" }));

	return (data || []).map((item: any) => ({
		...item,
		name: people.get(item.person_id)?.name || item.person_id,
		email: people.get(item.person_id)?.email || "",
	}));
}

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
	if (req.method !== "POST") return json({ success: false, message: "Method not allowed." }, 405);

	try {
		const url = Deno.env.get("SUPABASE_URL");
		const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		if (!url || !key) return json({ success: false, message: "Service configuration is missing." }, 500);
		const supabase = createClient(url, key);
		const adminId = await isMainAdmin(req, supabase);
		if (!adminId) return json({ success: false, message: "Main Admin access is required." }, 403);
		const body = await req.json().catch(() => ({}));

		if (body.action === "approve" || body.action === "reject") {
			if (!body.sessionId) return json({ success: false, message: "Session ID is required." }, 400);
			const rejectionReason = String(body.rejectionReason || "").trim();
			if (body.action === "reject" && !rejectionReason) return json({ success: false, message: "A rejection reason is required." }, 400);
			const { error } = await supabase
				.from("service_hour_sessions")
				.update({ approval_status: body.action === "approve" ? "approved" : "rejected", rejection_reason: body.action === "reject" ? rejectionReason : null, approved_by: adminId, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
				.eq("id", body.sessionId)
				.eq("approval_status", "pending")
				.not("ended_at", "is", null)
				.in("person_type", ["assistant", "e8"]);
			if (error) throw error;
		}

		return json({ success: true, records: await records(supabase) });
	} catch (error) {
		console.error("service-hours-admin error:", error);
		return json({ success: false, message: "Unable to load or update service hours." }, 500);
	}
});
