const jsonData = {
    "data": [
        {
            "event_name": "qualified",
            "event_time": send_time,
            "action_source": "system_generated",
            "user_data": {
                "lead_id": leadgen_id
            },
            "custom_data": {
                "event_source": "crm",
                "lead_event_source": "toyota crm"
            }
        }
    ]
};

module.exports = jsonData;