"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { updateProfile } from "@/lib/actions/updateProfile";

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const COUNTRY_DROPDOWN_LIMIT = 8;

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

const labelClassName =
  "mb-1 block font-primary text-[11px] text-[var(--text-muted)]";
const inputClassName =
  "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors";
const valueClassName = "font-primary text-sm text-[var(--text)]";
const emptyClassName = "text-[var(--text-muted)]";

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
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="font-primary text-sm font-bold text-[var(--text)]">{title}</p>
      {editing ? (
        <div className="flex items-center gap-2">
          <Button onClick={onCancel} disabled={loading} size="sm" variant="ghost">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={loading} size="sm">
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      ) : (
        <Button onClick={onEdit} size="sm" variant="secondary">
          Edit
        </Button>
      )}
    </div>
  );
}

interface Props {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  universityName: string | null;
  countryOfOrigin: string | null;
  role?: "student" | "parent";
}

export function ProfileSection({
  firstName,
  lastName,
  email,
  phoneNumber,
  universityName,
  countryOfOrigin,
  role = "student",
}: Props) {
  const router = useRouter();
  const [savedFirstName, setSavedFirstName] = useState(firstName ?? "");
  const [savedLastName, setSavedLastName] = useState(lastName ?? "");
  const [draftFirstName, setDraftFirstName] = useState(firstName ?? "");
  const [draftLastName, setDraftLastName] = useState(lastName ?? "");
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState("");
  const [personalSaved, setPersonalSaved] = useState(false);

  const [savedPhone, setSavedPhone] = useState(phoneNumber ?? "");
  const [savedUniversity, setSavedUniversity] = useState(universityName ?? "");
  const [savedCountry, setSavedCountry] = useState(countryOfOrigin ?? "");
  const [draftPhone, setDraftPhone] = useState(phoneNumber ?? "");
  const [draftUniversity, setDraftUniversity] = useState(universityName ?? "");
  const [draftCountry, setDraftCountry] = useState(countryOfOrigin ?? "");
  const [editingContact, setEditingContact] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSaved, setContactSaved] = useState(false);

  const [countryQuery, setCountryQuery] = useState(countryOfOrigin ?? "");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(countryQuery.toLowerCase())
  ).slice(0, COUNTRY_DROPDOWN_LIMIT);

  useEffect(() => {
    if (!personalSaved) return;
    const timer = setTimeout(() => setPersonalSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [personalSaved]);

  useEffect(() => {
    if (!contactSaved) return;
    const timer = setTimeout(() => setContactSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [contactSaved]);

  function handleEditPersonal() {
    setDraftFirstName(savedFirstName);
    setDraftLastName(savedLastName);
    setPersonalError("");
    setPersonalSaved(false);
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
    const result = await updateProfile({
      first_name: draftFirstName,
      last_name: draftLastName,
    });
    setPersonalLoading(false);
    if (!result.success) {
      setPersonalError(result.error);
      return;
    }
    setSavedFirstName(draftFirstName);
    setSavedLastName(draftLastName);
    setEditingPersonal(false);
    setPersonalSaved(true);
    router.refresh();
  }

  function handleEditContact() {
    setDraftPhone(savedPhone);
    setDraftUniversity(savedUniversity);
    setDraftCountry(savedCountry);
    setCountryQuery(savedCountry);
    setContactError("");
    setContactSaved(false);
    setEditingContact(true);
  }

  function handleCancelContact() {
    setDraftPhone(savedPhone);
    setDraftUniversity(savedUniversity);
    setDraftCountry(savedCountry);
    setCountryQuery(savedCountry);
    setContactError("");
    setContactSaved(false);
    setShowCountryDropdown(false);
    setEditingContact(false);
  }

  async function handleSaveContact() {
    if (draftPhone) {
      const strippedPhone = draftPhone.replace(/\s+/g, "");
      if (!PHONE_REGEX.test(strippedPhone)) {
        setContactError(
          "Please enter a valid international number e.g. +1 234 567 8900"
        );
        return;
      }
    }

    setContactLoading(true);
    setContactError("");
    const result = await updateProfile(
      role === "parent"
        ? {
            phone_number: draftPhone,
            country_of_origin: draftCountry,
          }
        : {
            phone_number: draftPhone,
            university_name: draftUniversity,
            country_of_origin: draftCountry,
          }
    );
    setContactLoading(false);
    if (!result.success) {
      setContactError(result.error);
      return;
    }
    setSavedPhone(draftPhone);
    setSavedUniversity(draftUniversity);
    setSavedCountry(draftCountry);
    setShowCountryDropdown(false);
    setEditingContact(false);
    setContactSaved(true);
  }

  return (
    <section className="mb-6">
      <h2 className="mb-4 font-primary text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text)]">
        Profile
      </h2>

      <Card className="mb-3 border border-[var(--border)]" padding="md">
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
            <label className={labelClassName}>First name</label>
            {editingPersonal ? (
              <input
                type="text"
                value={draftFirstName}
                onChange={(event) => setDraftFirstName(event.target.value)}
                placeholder="Your first name"
                className={inputClassName}
              />
            ) : (
              <p className={valueClassName}>
                {savedFirstName || <span className={emptyClassName}>Not set</span>}
              </p>
            )}
          </div>
          <div>
            <label className={labelClassName}>Last name</label>
            {editingPersonal ? (
              <input
                type="text"
                value={draftLastName}
                onChange={(event) => setDraftLastName(event.target.value)}
                placeholder="Your last name"
                className={inputClassName}
              />
            ) : (
              <p className={valueClassName}>
                {savedLastName || <span className={emptyClassName}>Not set</span>}
              </p>
            )}
          </div>
          <div>
            <label className={labelClassName}>Email</label>
            <p className="font-primary text-sm text-[var(--text-muted)]">{email}</p>
          </div>
        </div>
        {personalError && (
          <p className="mt-3 font-primary text-xs text-[var(--destructive)]">
            {personalError}
          </p>
        )}
        {personalSaved && (
          <p className="mt-3 font-primary text-xs text-emerald-600">
            Profile updated.
          </p>
        )}
      </Card>

      <Card className="border border-[var(--border)]" padding="md">
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
            <label className={labelClassName}>Phone number</label>
            {editingContact ? (
              <input
                type="tel"
                value={draftPhone}
                onChange={(event) => setDraftPhone(event.target.value)}
                placeholder="+1 234 567 8900"
                className={inputClassName}
              />
            ) : (
              <p className={valueClassName}>
                {savedPhone || <span className={emptyClassName}>Not set</span>}
              </p>
            )}
          </div>
          {role === "student" && (
            <div>
              <label className={labelClassName}>University / School</label>
              {editingContact ? (
                <input
                  type="text"
                  value={draftUniversity}
                  onChange={(event) => setDraftUniversity(event.target.value)}
                  placeholder="e.g. University of Michigan"
                  className={inputClassName}
                />
              ) : (
                <p className={valueClassName}>
                  {savedUniversity || <span className={emptyClassName}>Not set</span>}
                </p>
              )}
            </div>
          )}
          <div className="relative">
            <label className={labelClassName}>Country of origin</label>
            {editingContact ? (
              <>
                <input
                  type="text"
                  value={countryQuery}
                  onChange={(event) => {
                    setCountryQuery(event.target.value);
                    setDraftCountry(event.target.value);
                    setShowCountryDropdown(true);
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  onBlur={() => setShowCountryDropdown(false)}
                  placeholder="Search countries…"
                  className={inputClassName}
                />
                {showCountryDropdown && filteredCountries.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-white shadow-[var(--shadow-md)]">
                    {filteredCountries.map((country) => (
                      <li
                        key={country}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setDraftCountry(country);
                          setCountryQuery(country);
                          setShowCountryDropdown(false);
                        }}
                        className="cursor-pointer px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[var(--bg-subtle)]"
                      >
                        {country}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className={valueClassName}>
                {savedCountry || <span className={emptyClassName}>Not set</span>}
              </p>
            )}
          </div>
        </div>
        {contactError && (
          <p className="mt-3 font-primary text-xs text-[var(--destructive)]">
            {contactError}
          </p>
        )}
        {contactSaved && (
          <p className="mt-3 font-primary text-xs text-emerald-600">
            Contact details updated.
          </p>
        )}
      </Card>
    </section>
  );
}
