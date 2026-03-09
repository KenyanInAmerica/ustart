"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/updateProfile";

// Mirrors the server action's regex — strips spaces before testing.
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

// Full list of world countries (UN members + commonly recognised states).
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile",
  "China", "Colombia", "Comoros", "Congo (DRC)", "Congo (Republic)",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen",
  "Zambia", "Zimbabwe",
];

interface Props {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  universityName: string | null;
  countryOfOrigin: string | null;
}

export function ProfileSection({
  firstName,
  lastName,
  email,
  phoneNumber,
  universityName,
  countryOfOrigin,
}: Props) {
  const router = useRouter();

  // ── Personal Info state ───────────────────────────────────────────────────
  const [savedFirstName, setSavedFirstName] = useState(firstName ?? "");
  const [savedLastName, setSavedLastName] = useState(lastName ?? "");
  const [draftFirstName, setDraftFirstName] = useState(firstName ?? "");
  const [draftLastName, setDraftLastName] = useState(lastName ?? "");
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState("");

  function handleEditPersonal() {
    setDraftFirstName(savedFirstName);
    setDraftLastName(savedLastName);
    setPersonalError("");
    setEditingPersonal(true);
  }

  function handleCancelPersonal() {
    setDraftFirstName(savedFirstName);
    setDraftLastName(savedLastName);
    setPersonalError("");
    setEditingPersonal(false);
  }

  async function handleSavePersonal() {
    setPersonalLoading(true);
    setPersonalError("");
    const result = await updateProfile({ first_name: draftFirstName, last_name: draftLastName });
    setPersonalLoading(false);
    if (result.success) {
      setSavedFirstName(draftFirstName);
      setSavedLastName(draftLastName);
      setEditingPersonal(false);
      // Refresh the page's server components so the dashboard Greeting picks up
      // the new name on the next navigation (revalidatePath in the action
      // handles the dashboard cache; refresh() re-fetches this page's data).
      router.refresh();
    } else {
      setPersonalError(result.error);
    }
  }

  // ── Contact & Background state ────────────────────────────────────────────
  const [savedPhone, setSavedPhone] = useState(phoneNumber ?? "");
  const [savedUniversity, setSavedUniversity] = useState(universityName ?? "");
  const [savedCountry, setSavedCountry] = useState(countryOfOrigin ?? "");
  const [draftPhone, setDraftPhone] = useState(phoneNumber ?? "");
  const [draftUniversity, setDraftUniversity] = useState(universityName ?? "");
  const [draftCountry, setDraftCountry] = useState(countryOfOrigin ?? "");
  const [editingContact, setEditingContact] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");

  // Combobox state — tracks the text in the country input and dropdown visibility.
  const [countryQuery, setCountryQuery] = useState(countryOfOrigin ?? "");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countryQuery.toLowerCase())
  ).slice(0, 8); // cap at 8 options to keep the dropdown compact

  function handleEditContact() {
    setDraftPhone(savedPhone);
    setDraftUniversity(savedUniversity);
    setDraftCountry(savedCountry);
    setCountryQuery(savedCountry);
    setContactError("");
    setEditingContact(true);
  }

  function handleCancelContact() {
    setDraftPhone(savedPhone);
    setDraftUniversity(savedUniversity);
    setDraftCountry(savedCountry);
    setCountryQuery(savedCountry);
    setContactError("");
    setShowCountryDropdown(false);
    setEditingContact(false);
  }

  async function handleSaveContact() {
    // Client-side phone guard mirrors the server action.
    if (draftPhone) {
      const stripped = draftPhone.replace(/\s+/g, "");
      if (!PHONE_REGEX.test(stripped)) {
        setContactError(
          "Please enter a valid international number e.g. +1 234 567 8900"
        );
        return;
      }
    }
    setContactLoading(true);
    setContactError("");
    const result = await updateProfile({
      phone_number: draftPhone,
      university_name: draftUniversity,
      country_of_origin: draftCountry,
    });
    setContactLoading(false);
    if (result.success) {
      setSavedPhone(draftPhone);
      setSavedUniversity(draftUniversity);
      setSavedCountry(draftCountry);
      setShowCountryDropdown(false);
      setEditingContact(false);
    } else {
      setContactError(result.error);
    }
  }

  // ── Shared sub-component helpers ──────────────────────────────────────────

  function SubsectionHeader({
    title,
    editing,
    loading,
    onEdit,
    onSave,
    onCancel,
  }: {
    title: string;
    editing: boolean;
    loading: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
  }) {
    return (
      <div className="flex items-center justify-between mb-4">
        <p className="font-syne text-sm font-bold text-white">{title}</p>
        {editing ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="font-dm-sans text-xs text-white/[0.42] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={loading}
              className="font-dm-sans text-xs text-white bg-white/[0.1] border border-white/[0.12] px-3 py-1 rounded-lg hover:bg-white/[0.15] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="font-dm-sans text-xs text-white/[0.42] hover:text-white transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="mb-6">
      <h2 className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-4">
        Profile
      </h2>

      {/* Personal Info */}
      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5 mb-3">
        <SubsectionHeader
          title="Personal Info"
          editing={editingPersonal}
          loading={personalLoading}
          onEdit={handleEditPersonal}
          onSave={handleSavePersonal}
          onCancel={handleCancelPersonal}
        />
        <div className="space-y-3">
          <div>
            <label className="block font-dm-sans text-[11px] text-white/[0.42] mb-1">
              First name
            </label>
            {editingPersonal ? (
              <input
                type="text"
                value={draftFirstName}
                onChange={(e) => setDraftFirstName(e.target.value)}
                placeholder="Your first name"
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/[0.28] focus:outline-none focus:border-white/[0.28] transition-colors"
              />
            ) : (
              <p className="font-dm-sans text-sm text-white/[0.68]">
                {savedFirstName || (
                  <span className="text-white/[0.28]">Not set</span>
                )}
              </p>
            )}
          </div>
          <div>
            <label className="block font-dm-sans text-[11px] text-white/[0.42] mb-1">
              Last name
            </label>
            {editingPersonal ? (
              <input
                type="text"
                value={draftLastName}
                onChange={(e) => setDraftLastName(e.target.value)}
                placeholder="Your last name"
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/[0.28] focus:outline-none focus:border-white/[0.28] transition-colors"
              />
            ) : (
              <p className="font-dm-sans text-sm text-white/[0.68]">
                {savedLastName || (
                  <span className="text-white/[0.28]">Not set</span>
                )}
              </p>
            )}
          </div>
          <div>
            <label className="block font-dm-sans text-[11px] text-white/[0.42] mb-1">
              Email
            </label>
            {/* Email is always read-only — changes go through Supabase Auth */}
            <p className="font-dm-sans text-sm text-white/[0.42]">{email}</p>
          </div>
        </div>
        {personalError && (
          <p className="font-dm-sans text-xs text-red-400 mt-3">{personalError}</p>
        )}
      </div>

      {/* Contact & Background */}
      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5">
        <SubsectionHeader
          title="Contact & Background"
          editing={editingContact}
          loading={contactLoading}
          onEdit={handleEditContact}
          onSave={handleSaveContact}
          onCancel={handleCancelContact}
        />
        <div className="space-y-3">
          <div>
            <label className="block font-dm-sans text-[11px] text-white/[0.42] mb-1">
              Phone number
            </label>
            {editingContact ? (
              <input
                type="tel"
                value={draftPhone}
                onChange={(e) => setDraftPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/[0.28] focus:outline-none focus:border-white/[0.28] transition-colors"
              />
            ) : (
              <p className="font-dm-sans text-sm text-white/[0.68]">
                {savedPhone || <span className="text-white/[0.28]">Not set</span>}
              </p>
            )}
          </div>
          <div>
            <label className="block font-dm-sans text-[11px] text-white/[0.42] mb-1">
              University / School
            </label>
            {editingContact ? (
              <input
                type="text"
                value={draftUniversity}
                onChange={(e) => setDraftUniversity(e.target.value)}
                placeholder="e.g. University of Michigan"
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/[0.28] focus:outline-none focus:border-white/[0.28] transition-colors"
              />
            ) : (
              <p className="font-dm-sans text-sm text-white/[0.68]">
                {savedUniversity || (
                  <span className="text-white/[0.28]">Not set</span>
                )}
              </p>
            )}
          </div>

          {/* Country combobox — lightweight filter-as-you-type, no library */}
          <div className="relative">
            <label className="block font-dm-sans text-[11px] text-white/[0.42] mb-1">
              Country of origin
            </label>
            {editingContact ? (
              <>
                <input
                  type="text"
                  value={countryQuery}
                  onChange={(e) => {
                    setCountryQuery(e.target.value);
                    setDraftCountry(e.target.value);
                    setShowCountryDropdown(true);
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  onBlur={() => setShowCountryDropdown(false)}
                  placeholder="Search countries…"
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/[0.28] focus:outline-none focus:border-white/[0.28] transition-colors"
                />
                {showCountryDropdown && filteredCountries.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-[#0C1220] border border-white/[0.12] rounded-xl overflow-hidden shadow-xl">
                    {filteredCountries.map((country) => (
                      <li
                        key={country}
                        // onMouseDown with preventDefault keeps the input focused so
                        // onBlur doesn't fire before the selection is registered.
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setDraftCountry(country);
                          setCountryQuery(country);
                          setShowCountryDropdown(false);
                        }}
                        className="px-3 py-2 text-sm text-white/[0.68] hover:bg-white/[0.05] hover:text-white cursor-pointer transition-colors"
                      >
                        {country}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="font-dm-sans text-sm text-white/[0.68]">
                {savedCountry || (
                  <span className="text-white/[0.28]">Not set</span>
                )}
              </p>
            )}
          </div>
        </div>
        {contactError && (
          <p className="font-dm-sans text-xs text-red-400 mt-3">{contactError}</p>
        )}
      </div>
    </section>
  );
}
