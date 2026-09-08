import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { verifyAssistantUser } from "../lib/assistantAuth";
import { supabase } from "../lib/supabase";

type Student = { student_id: string; name: string; email: string; phone: string; course: string };
type ServiceSession = { active_seconds: number; required_seconds: number; extra_seconds: number; ended_at: string | null; approval_status: string };

function formatServiceTime(seconds: number) {
  const safe = Math.max(0, Number(seconds || 0));
  return `${String(Math.floor(safe / 3600)).padStart(2, "0")}:${String(Math.floor((safe % 3600) / 60)).padStart(2, "0")}`;
}

export default function AssistantDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [method, setMethod] = useState("Phone");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [service, setService] = useState<ServiceSession | null>(null);
  const [serviceBusy, setServiceBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? students.filter((s) => Object.values(s).join(" ").toLowerCase().includes(q)) : students;
  }, [students, search]);

  async function loadStudents() {
    setBusy(true);
    const { data, error } = await supabase.rpc("assistant_list_students");
    setBusy(false);
    if (error) return setMessage("❌ Could not load students: " + error.message);
    setStudents((data || []) as Student[]);
    setMessage("");
  }

  async function resetPassword() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return setMessage("❌ Enter the assistant email first.");
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: "https://ega-2026.vercel.app/assistant-dashboard",
    });

    setBusy(false);

    if (error) {
      return setMessage("❌ Password reset failed: " + error.message);
    }

    setMessage("✅ Password reset email sent. Open the newest email from Supabase.");
  }

  async function login() {
    if (!email.trim() || !password.trim()) return setMessage("❌ Enter the assistant email and password.");
    setBusy(true); setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password.trim() });
    if (error || !data.user) { setBusy(false); return setMessage("❌ " + (error?.message || "Login failed.")); }
    const check = await verifyAssistantUser(data.user.id, data.user.email || email);
    if (!check.isAssistant) { await supabase.auth.signOut(); setBusy(false); return setMessage("❌ " + check.error); }
    setAssistantId(check.userId); setAssistantName(check.fullName); setLoggedIn(true); setPassword("");
    await loadStudents();
    await loadService("status");
  }

  async function loadService(action: "status" | "check_in" | "check_out") {
    setServiceBusy(true);
    const { data, error } = await supabase.functions.invoke("service-hours-heartbeat", { body: { action } });
    setServiceBusy(false);
    if (error || !data?.success) {
      setMessage("❌ " + (data?.message || error?.message || "Service-hours request failed."));
      return;
    }
    setService(data.service || null);
    if (action !== "status") setMessage(action === "check_in" ? "✅ Checked in." : "✅ Checked out. Time recorded.");
  }

  function choose(s: Student) {
    setSelected(s); setEditName(s.name || ""); setEditEmail(s.email || ""); setEditPhone(s.phone || "");
    setOutcome(""); setNotes(""); setMessage("");
  }

  async function saveContact() {
    if (!selected || !editName.trim()) return setMessage("❌ Student name is required.");
    setBusy(true);
    const { error } = await supabase.rpc("assistant_update_student_contact", { p_student_id: selected.student_id, p_name: editName.trim(), p_email: editEmail.trim(), p_phone: editPhone.trim() });
    setBusy(false);
    if (error) return setMessage("❌ Contact update failed: " + error.message);
    setSelected({ ...selected, name: editName.trim(), email: editEmail.trim().toLowerCase(), phone: editPhone.trim() });
    setMessage("✅ Student contact information updated."); await loadStudents();
  }

  async function attendance(status: "Present" | "Absent" | "Excused") {
    if (!selected) return;
    setBusy(true);
    const { error } = await supabase.rpc("assistant_save_attendance", { p_student_id: selected.student_id, p_status: status });
    setBusy(false); setMessage(error ? "❌ Attendance failed: " + error.message : `✅ ${selected.name} marked ${status} today.`);
  }

  async function followup() {
    if (!selected || !assistantId || !outcome.trim()) return setMessage("❌ Enter the follow-up result.");
    setBusy(true);
    const { error } = await supabase.from("student_followups").insert({ student_id: selected.student_id, assistant_user_id: assistantId, contact_method: method, outcome: outcome.trim(), notes: notes.trim() || null });
    setBusy(false);
    if (error) return setMessage("❌ Follow-up failed: " + error.message);
    setOutcome(""); setNotes(""); setMessage("✅ Student follow-up recorded.");
  }

  async function logout() {
    await supabase.auth.signOut(); setLoggedIn(false); setStudents([]); setSelected(null); setAssistantId(""); setMessage("✅ Assistant logged out safely.");
  }

  if (!loggedIn) return <ScrollView style={s.container} contentContainerStyle={s.content}><View style={s.box}>
    <Text style={s.title}>EGA Assistant Login</Text><Text style={s.subtitle}>Secure limited administration access</Text>
    <Text style={s.label}>Assistant Email</Text><TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    <Text style={s.label}>Assistant Password</Text><TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={() => void login()} />
    <Pressable style={s.primary} onPress={() => void login()} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={s.white}>Login as Assistant</Text>}</Pressable>
    <Pressable style={s.back} onPress={() => void resetPassword()} disabled={busy}>
      <Text style={s.backText}>Forgot Password?</Text>
    </Pressable>
    {message ? <Text style={s.message}>{message}</Text> : null}<Link href="/service-hours-schedule" asChild>
  <Pressable style={s.back}>
    <Text style={s.backText}>📅 View Work Schedule</Text>
  </Pressable>
</Link>

<Link href="/" asChild><Pressable style={s.back}><Text style={s.backText}>← Back to Home</Text></Pressable></Link>
  </View></ScrollView>;

  return <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.title}>EGA Assistant Dashboard</Text><Text style={s.subtitle}>Welcome, {assistantName || "Assistant"}</Text>
    <View style={s.notice}><Text style={s.noticeTitle}>Limited Access</Text><Text>Payments, fees, certificates and assessment retakes remain under owner control.</Text></View>
    <View style={s.notice}><Text style={s.noticeTitle}>Service Hours</Text><Text>Required: 08:00 • Completed: {formatServiceTime(service?.active_seconds || 0)} • Remaining: {formatServiceTime(Math.max(0, (service?.required_seconds || 28800) - (service?.active_seconds || 0)))} • Extra: {formatServiceTime(service?.extra_seconds || 0)}</Text><View style={s.row}><Pressable style={s.small} onPress={() => void loadService("check_in")} disabled={serviceBusy || !!service && !service.ended_at}><Text style={s.white}>Check In</Text></Pressable><Pressable style={s.logout} onPress={() => void loadService("check_out")} disabled={serviceBusy || !service || !!service.ended_at}><Text style={s.white}>Check Out</Text></Pressable></View><Text>{service ? `Approval: ${service.approval_status}` : "No session today"}</Text></View>
    <TextInput style={s.input} value={search} onChangeText={setSearch} placeholder="Search name, ID, phone or email" />
    <Pressable style={s.secondary} onPress={() => void loadStudents()}><Text style={s.secondaryText}>Refresh Students ({students.length})</Text></Pressable>
    {message ? <Text style={s.message}>{message}</Text> : null}{busy ? <ActivityIndicator size="large" color="#244394" /> : null}
    {!selected ? <View>{filtered.map((student) => <Pressable key={student.student_id} style={s.card} onPress={() => choose(student)}><Text style={s.name}>{student.name}</Text><Text>{student.student_id}</Text><Text>{student.course}</Text><Text>{student.phone}</Text></Pressable>)}</View> :
    <View style={s.box}><Pressable style={s.back} onPress={() => setSelected(null)}><Text style={s.backText}>← Student List</Text></Pressable>
      <Text style={s.heading}>{selected.name}</Text><Text>{selected.student_id} • {selected.course}</Text>
      <Text style={s.heading}>Contact Information</Text><Text style={s.label}>Name</Text><TextInput style={s.input} value={editName} onChangeText={setEditName} />
      <Text style={s.label}>Email</Text><TextInput style={s.input} value={editEmail} onChangeText={setEditEmail} autoCapitalize="none" />
      <Text style={s.label}>Phone</Text><TextInput style={s.input} value={editPhone} onChangeText={setEditPhone} />
      <Pressable style={s.primary} onPress={() => void saveContact()}><Text style={s.white}>Save Contact Changes</Text></Pressable>
      <Text style={s.heading}>Today’s Attendance</Text><View style={s.row}>{(["Present", "Absent", "Excused"] as const).map((s2) => <Pressable key={s2} style={s.small} onPress={() => void attendance(s2)}><Text style={s.white}>{s2}</Text></Pressable>)}</View>
      <Text style={s.heading}>Record Follow-Up</Text><View style={s.row}>{["Phone", "WhatsApp", "Email", "In Person"].map((m) => <Pressable key={m} style={[s.method, method === m && s.selected]} onPress={() => setMethod(m)}><Text>{m}</Text></Pressable>)}</View>
      <TextInput style={s.input} value={outcome} onChangeText={setOutcome} placeholder="Follow-up result" /><TextInput style={[s.input, s.notes]} value={notes} onChangeText={setNotes} placeholder="Notes" multiline />
      <Pressable style={s.primary} onPress={() => void followup()}><Text style={s.white}>Save Follow-Up</Text></Pressable>
    </View>}
    <Pressable style={s.logout} onPress={() => void logout()}><Text style={s.white}>Logout Assistant</Text></Pressable>
  </ScrollView>;
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:"#eaf2ff"},content:{flexGrow:1,width:"100%",maxWidth:850,alignSelf:"center",padding:20,paddingBottom:60},box:{backgroundColor:"#fff",padding:22,borderRadius:16,marginTop:25},title:{fontSize:31,fontWeight:"bold",textAlign:"center",color:"#003366",marginTop:18},subtitle:{fontSize:18,textAlign:"center",color:"#475569",marginBottom:24},label:{fontSize:16,fontWeight:"bold",marginBottom:6},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#cbd5e1",padding:14,borderRadius:11,fontSize:17,marginBottom:14},primary:{backgroundColor:"#244394",padding:15,borderRadius:11,alignItems:"center",marginBottom:14},white:{color:"#fff",fontWeight:"bold",fontSize:16},message:{backgroundColor:"#fff",padding:13,borderRadius:10,marginVertical:12,fontSize:16},back:{padding:13,alignItems:"center"},backText:{color:"#244394",fontWeight:"bold"},notice:{backgroundColor:"#fff7d6",borderWidth:1,borderColor:"#eab308",padding:16,borderRadius:12,marginBottom:18},noticeTitle:{fontWeight:"bold",fontSize:18,color:"#854d0e",marginBottom:5},secondary:{backgroundColor:"#dbeafe",padding:13,borderRadius:11,alignItems:"center",marginBottom:16},secondaryText:{color:"#1e3a8a",fontWeight:"bold"},card:{backgroundColor:"#fff",padding:17,borderRadius:13,marginBottom:12,borderWidth:1,borderColor:"#dbe3ef"},name:{fontSize:19,fontWeight:"bold",color:"#003366",marginBottom:5},heading:{fontSize:21,fontWeight:"bold",color:"#003366",marginTop:22,marginBottom:12},row:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:15},small:{backgroundColor:"#0f766e",padding:11,borderRadius:9},method:{backgroundColor:"#e2e8f0",padding:10,borderRadius:9},selected:{backgroundColor:"#93c5fd"},notes:{minHeight:90,textAlignVertical:"top"},logout:{backgroundColor:"#b91c1c",padding:15,borderRadius:11,alignItems:"center",marginTop:25}
});
