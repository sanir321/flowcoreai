const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bnpdrelienfnlkceluip.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucGRyZWxpZW5mbmxrY2VsdWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg1ODI0MiwiZXhwIjoyMDkyNDM0MjQyfQ.OURQfh3fe0ZFpHzKfis3ym6-v0Ug2qbwBdIEalJr6CU');
async function run() {
  const { data, error } = await supabase.from('contacts').upsert({
    workspace_id: 'eb8e551d-cde7-46c3-bafe-817afaeabedd',
    whatsapp_jid: '1234567890@s.whatsapp.net',
    channel: 'whatsapp',
    phone: '1234567890'
  }).select('id').maybeSingle();
  console.log(data, error);
}
run();
