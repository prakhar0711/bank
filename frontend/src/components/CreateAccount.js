<FormControl fullWidth>
  <InputLabel>Account Type</InputLabel>
  <Select
    value={accountType}
    onChange={(e) => setAccountType(e.target.value)}
    label="Account Type"
  >
    <MenuItem value="savings">Savings</MenuItem>
    <MenuItem value="current">Current</MenuItem>
  </Select>
</FormControl> 