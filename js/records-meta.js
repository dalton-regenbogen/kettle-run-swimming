async function initRecordsMeta() {
  try {
    const res = await fetch("/assets/data/records-meta.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load records-meta.json");
    const meta = await res.json();

    const lastUpdatedElBoys = document.getElementById("recordsLastUpdatedBoys");
    const lastUpdatedElGirls = document.getElementById("recordsLastUpdatedGirls");
    const lastUpdatedElMobile = document.getElementById("recordsLastUpdatedMobile");
    const pdfLink = document.getElementById("recordsPdfLink");

    if (lastUpdatedElBoys && meta.lastUpdated) {
      // Display as-is (you can format later)
      lastUpdatedElBoys.textContent = `Last updated: ${meta.lastUpdated}`;
    }

    if (lastUpdatedElGirls && meta.lastUpdated) {
      // Display as-is (you can format later)
      lastUpdatedElGirls.textContent = `Last updated: ${meta.lastUpdated}`;
    }

    if (lastUpdatedElMobile && meta.lastUpdated) {
      // Display as-is (you can format later)
      lastUpdatedElMobile.textContent = `Last updated: ${meta.lastUpdated}`;
    }

    if (pdfLink && meta.version) {
      // Cache-bust PDF while keeping stable filename
      pdfLink.href = `/assets/records/krhs-records.pdf?v=${encodeURIComponent(meta.version)}`;
    }
  } catch (err) {
    console.warn(err);
  }
}

document.addEventListener("DOMContentLoaded", initRecordsMeta);
