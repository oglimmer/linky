{{- define "linky.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "linky.labels" -}}
app.kubernetes.io/name: linky
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "linky.serverLabels" -}}
{{ include "linky.labels" . }}
app.kubernetes.io/component: server
{{- end }}

{{- define "linky.clientLabels" -}}
{{ include "linky.labels" . }}
app.kubernetes.io/component: client
{{- end }}

{{- define "linky.serverSelectorLabels" -}}
app.kubernetes.io/name: linky
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: server
{{- end }}

{{- define "linky.clientSelectorLabels" -}}
app.kubernetes.io/name: linky
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: client
{{- end }}
