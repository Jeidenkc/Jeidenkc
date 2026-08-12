path = "app/dashboard/page.tsx"
with open(path) as f:
    content = f.read()

old = "  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);"
new = old + "\n  const [subscription, setSubscription] = useState<SignalSubscription | null>(null);"

if old not in content:
    print("STILL NOT FOUND")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("state OK")
