path = "app/dashboard/page.tsx"
with open(path) as f:
    content = f.read()

marker = '{/* DEPOSIT HISTORY */}'
if marker not in content:
    print("MARKER NOT FOUND")
else:
    section = '''{/* SIGNALS BOT SUBSCRIPTION */}
      <section
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>
            Signals Bot Subscription
          </h2>
          <p style={{ margin: "5px 0 0", color: "#6b7280", fontSize: "13px" }}>
            Your current Signals Bot subscription status.
          </p>
        </div>

        {!subscription ? (
          <EmptyState text="No active subscription." />
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Expires</th>
                  <th style={thStyle}>Subscribed On</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>
                    <span
                      style={{
                        ...statusBadgeStyle,
                        ...getStatusStyle(subscription.status),
                      }}
                    >
                      {subscription.status || "Pending"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {formatDate(subscription.expires_at)}
                  </td>
                  <td style={tdStyle}>
                    {formatDate(subscription.created_at)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      ''' + marker

    content = content.replace(marker, section, 1)
    with open(path, "w") as f:
        f.write(content)
    print("table OK")
