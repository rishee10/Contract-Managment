import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "date", label: "Date" },
  { value: "signature", label: "Signature" },
  { value: "checkbox", label: "Checkbox" },
];

const STATUS_FILTERS = {
  ALL: null,
  ACTIVE: ["CREATED", "APPROVED", "SENT"],
  PENDING: ["CREATED", "APPROVED"],
  SIGNED: ["SIGNED"],
};

function App() {
  const [blueprints, setBlueprints] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedContractId, setSelectedContractId] = useState(null);

  // Blueprint form state
  const [bpName, setBpName] = useState("");
  const [bpFields, setBpFields] = useState([
    { field_type: "text", label: "Example field", position_x: 0, position_y: 0 },
  ]);

  // Contract creation form
  const [contractName, setContractName] = useState("");
  const [contractBpId, setContractBpId] = useState("");

  // Contract field edits
  const [fieldEdits, setFieldEdits] = useState({});

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === selectedContractId),
    [contracts, selectedContractId]
  );

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [bpRes, cRes] = await Promise.all([
        axios.get(`${API_URL}/blueprints/`),
        axios.get(`${API_URL}/contracts/`),
      ]);
      setBlueprints(bpRes.data);
      setContracts(cRes.data);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setLoading(false);
    }
  };

  const messageFromError = (err) => {
    if (err.response?.data?.detail) return err.response.data.detail;
    if (err.response?.data) return JSON.stringify(err.response.data);
    return err.message || "Something went wrong";
  };

  const addBpField = () => {
    setBpFields((prev) => [
      ...prev,
      { field_type: "text", label: "", position_x: 0, position_y: 0 },
    ]);
  };

  const updateBpField = (idx, key, value) => {
    setBpFields((prev) => prev.map((f, i) => (i === idx ? { ...f, [key]: value } : f)));
  };

  const removeBpField = (idx) => {
    setBpFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateBlueprint = async (e) => {
    e.preventDefault();
    setError("");
    if (!bpName.trim()) return setError("Blueprint name is required");
    if (!bpFields.length) return setError("Add at least one field");
    try {
      const payload = {
        name: bpName.trim(),
        fields: bpFields.map((f) => ({
          ...f,
          position_x: Number(f.position_x) || 0,
          position_y: Number(f.position_y) || 0,
        })),
      };
      await axios.post(`${API_URL}/blueprints/`, payload);
      setBpName("");
      setBpFields([{ field_type: "text", label: "Example field", position_x: 0, position_y: 0 }]);
      await loadAll();
    } catch (err) {
      setError(messageFromError(err));
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    setError("");
    if (!contractName.trim()) return setError("Contract name is required");
    if (!contractBpId) return setError("Select a blueprint");
    try {
      await axios.post(`${API_URL}/contracts/`, {
        name: contractName.trim(),
        blueprint_id: Number(contractBpId),
      });
      setContractName("");
      setContractBpId("");
      await loadAll();
    } catch (err) {
      setError(messageFromError(err));
    }
  };

  const handleSelectContract = (id) => {
    setSelectedContractId(id);
    const c = contracts.find((x) => x.id === id);
    if (c) {
      const edits = {};
      c.fields.forEach((f) => {
        edits[f.id] = f.value || "";
      });
      setFieldEdits(edits);
    }
  };

  const handleTransition = async (contractId, newStatus) => {
    setError("");
    try {
      await axios.post(`${API_URL}/contracts/${contractId}/transition/`, { new_status: newStatus });
      await loadAll();
      setSelectedContractId(contractId);
    } catch (err) {
      setError(messageFromError(err));
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setFieldEdits((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSaveFields = async () => {
    if (!selectedContract) return;
    setError("");
    try {
      const payload = {
        fields: selectedContract.fields.map((f) => ({
          id: f.id,
          value: fieldEdits[f.id] ?? "",
        })),
      };
      await axios.post(`${API_URL}/contracts/${selectedContract.id}/update_fields/`, payload);
      await loadAll();
      setSelectedContractId(selectedContract.id);
    } catch (err) {
      setError(messageFromError(err));
    }
  };

  const filteredContracts = useMemo(() => {
    const filter = STATUS_FILTERS[selectedFilter];
    if (!filter) return contracts;
    return contracts.filter((c) => filter.includes(c.status));
  }, [contracts, selectedFilter]);

  return (
    <div className="layout">
      <header className="topbar">
        <div>
          <h1>Contract Management Platform</h1>
          <p className="muted">Blueprints, contract creation, lifecycle actions</p>
        </div>
        <div className="status-pill">{loading ? "Loading..." : "Ready"}</div>
      </header>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="grid two">
        <section className="card">
          <div className="card-head">
            <h2>Create Blueprint</h2>
            <span className="muted">Field types, labels, positions</span>
          </div>
          <form onSubmit={handleCreateBlueprint} className="stack">
            <label className="field">
              <span>Name</span>
              <input value={bpName} onChange={(e) => setBpName(e.target.value)} placeholder="NDA Template" />
            </label>

            <div className="field">
              <div className="between">
                <span>Fields</span>
                <button type="button" onClick={addBpField} className="ghost">
                  + Add field
                </button>
              </div>
              <div className="field-list">
                {bpFields.map((f, idx) => (
                  <div key={idx} className="field-row">
                    <select
                      value={f.field_type}
                      onChange={(e) => updateBpField(idx, "field_type", e.target.value)}
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.value} value={ft.value}>
                          {ft.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={f.label}
                      onChange={(e) => updateBpField(idx, "label", e.target.value)}
                      placeholder="Label"
                    />
                    <input
                      type="number"
                      value={f.position_x}
                      onChange={(e) => updateBpField(idx, "position_x", e.target.value)}
                      placeholder="X"
                    />
                    <input
                      type="number"
                      value={f.position_y}
                      onChange={(e) => updateBpField(idx, "position_y", e.target.value)}
                      placeholder="Y"
                    />
                    <button type="button" onClick={() => removeBpField(idx)} className="ghost">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="primary">
              Save Blueprint
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Create Contract</h2>
            <span className="muted">Instantiates from a blueprint</span>
          </div>
          <form onSubmit={handleCreateContract} className="stack">
            <label className="field">
              <span>Name</span>
              <input value={contractName} onChange={(e) => setContractName(e.target.value)} placeholder="Acme NDA #12" />
            </label>

            <label className="field">
              <span>Blueprint</span>
              <select value={contractBpId} onChange={(e) => setContractBpId(e.target.value)}>
                <option value="">Select blueprint</option>
                {blueprints.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="primary">
              Create Contract
            </button>
          </form>

          <div className="card-sub">
            <h3>Blueprints</h3>
            <ul className="pill-list">
              {blueprints.map((bp) => (
                <li key={bp.id} className="pill">
                  {bp.name} · {bp.fields.length} fields
                </li>
              ))}
              {!blueprints.length && <li className="muted">No blueprints yet</li>}
            </ul>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="between">
          <div>
            <h2>Contracts Dashboard</h2>
            <span className="muted">Lifecycle actions and filters</span>
          </div>
          <div className="pill-row">
            {Object.keys(STATUS_FILTERS).map((key) => (
              <button
                key={key}
                className={selectedFilter === key ? "chip active" : "chip"}
                onClick={() => setSelectedFilter(key)}
              >
                {key}
              </button>
            ))}
            <button className="chip ghost" onClick={loadAll}>
              Refresh
            </button>
          </div>
        </div>

        <div className="table">
          <div className="table-head">
            <span>Name</span>
            <span>Blueprint</span>
            <span>Status</span>
            <span>Created</span>
            <span>Actions</span>
          </div>
          {filteredContracts.map((c) => (
            <div key={c.id} className={`table-row ${selectedContractId === c.id ? "selected" : ""}`}>
              <span>{c.name}</span>
              <span>{c.blueprint_name}</span>
              <span className={`status ${c.status.toLowerCase()}`}>{c.status}</span>
              <span>{new Date(c.created_at).toLocaleString()}</span>
              <span className="actions">
                {c.allowed_transitions.map((t) => (
                  <button key={t} className="chip" onClick={() => handleTransition(c.id, t)}>
                    {t}
                  </button>
                ))}
                <button className="chip ghost" onClick={() => handleSelectContract(c.id)}>
                  View
                </button>
              </span>
            </div>
          ))}
          {!filteredContracts.length && (
            <div className="table-row muted">
              <span>No contracts</span>
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </section>

      {selectedContract && (
        <section className="card">
          <div className="between">
            <div>
              <h2>Contract Detail</h2>
              <p className="muted">
                {selectedContract.name} · {selectedContract.blueprint_name} · {selectedContract.status}
              </p>
            </div>
            <button className="ghost" onClick={() => setSelectedContractId(null)}>
              Close
            </button>
          </div>

          <div className="stack">
            <div className="field">
              <span className="muted">Allowed transitions</span>
              <div className="pill-row">
                {selectedContract.allowed_transitions.length
                  ? selectedContract.allowed_transitions.map((t) => (
                      <button key={t} className="chip" onClick={() => handleTransition(selectedContract.id, t)}>
                        {t}
                      </button>
                    ))
                  : "No forward actions"}
              </div>
            </div>

            <div className="field">
              <span className="muted">Fields</span>
              <div className="field-list vertical">
                {selectedContract.fields.map((f) => (
                  <label key={f.id} className="field-row vertical">
                    <span>
                      {f.label} ({f.field_type})
                    </span>
                    <input
                      value={fieldEdits[f.id] ?? ""}
                      onChange={(e) => handleFieldChange(f.id, e.target.value)}
                      disabled={!["CREATED", "APPROVED", "SENT"].includes(selectedContract.status)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              className="primary"
              disabled={!["CREATED", "APPROVED", "SENT"].includes(selectedContract.status)}
              onClick={handleSaveFields}
            >
              Save Field Values
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
