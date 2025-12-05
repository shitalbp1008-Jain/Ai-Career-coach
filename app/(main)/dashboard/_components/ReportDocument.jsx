import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({ 
  family: 'Roboto', 
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' 
});
Font.register({
  family: 'Roboto Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf'
});

const styles = StyleSheet.create({
  page: { 
    flexDirection: 'column', 
    backgroundColor: '#FFFFFF', 
    padding: 30, 
    fontFamily: 'Roboto',
    fontSize: 11,
    color: '#333'
  },
  headerContainer: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
    paddingBottom: 10,
  },
  headerTitle: { 
    fontSize: 24, 
    fontFamily: 'Roboto Bold',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B', 
    marginTop: 4,
  },
  section: { 
    marginBottom: 20, 
  },
  sectionTitle: { 
    fontSize: 14, 
    marginBottom: 8, 
    fontFamily: 'Roboto Bold',
    color: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  card: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 14,
    fontFamily: 'Roboto Bold',
    color: '#0F172A',
  },
  table: { 
    display: 'table', 
    width: '100%', 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableRow: { 
    margin: 'auto', 
    flexDirection: 'row',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#F1F5F9',
    fontFamily: 'Roboto Bold',
    fontSize: 10,
    padding: 6,
    color: '#334155',
  },
  tableCell: { 
    fontSize: 10, 
    padding: 6, 
    color: '#334155',
  },
  colRole: { width: '40%' },
  colMetric: { width: '20%', textAlign: 'right' },
  listContainer: {
    marginLeft: 10,
  },
  listItem: {
    marginBottom: 4,
    fontSize: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillBadge: {
    backgroundColor: '#EFF6FF',
    padding: "4 8",
    borderRadius: 4,
  },
  skillText: {
    fontSize: 10,
    color: '#1D4ED8',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  }
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const ReportDocument = ({ insights, selectedSections = [] }) => {
  const showAll = !selectedSections || selectedSections.length === 0;
  const isSelected = (sectionName) => showAll || selectedSections.includes(sectionName);

  let salaryRanges = insights?.salaryRanges || [];
  if (typeof salaryRanges === 'string') {
    try { salaryRanges = JSON.parse(salaryRanges); } catch (e) { salaryRanges = []; }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header - UPDATED: Removed Industry Name */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Industry Insights</Text>
          <Text style={styles.headerSub}>
            AI Career Coach • {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* 1. Market Overview */}
        {(isSelected("Market Outlook") || isSelected("Industry Growth") || isSelected("Demand Level")) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            <View style={styles.grid}>
              {isSelected("Market Outlook") && (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Market Outlook</Text>
                  <Text style={styles.cardValue}>{insights.marketOutlook}</Text>
                </View>
              )}
              {isSelected("Industry Growth") && (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Growth Rate</Text>
                  <Text style={styles.cardValue}>
                    {insights.growthRate ? `${insights.growthRate.toFixed(1)}%` : "N/A"}
                  </Text>
                </View>
              )}
              {isSelected("Demand Level") && (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Demand Level</Text>
                  <Text style={styles.cardValue}>{insights.demandLevel}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 2. Salary Table */}
        {isSelected("Salary Ranges by Role") && salaryRanges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salary Compensation (Annual USD)</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, styles.colRole]}>Job Role</Text>
                <Text style={[styles.tableHeader, styles.colMetric]}>Min</Text>
                <Text style={[styles.tableHeader, styles.colMetric]}>Median</Text>
                <Text style={[styles.tableHeader, styles.colMetric]}>Max</Text>
              </View>
              
              {salaryRanges.map((range, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }
                  ]}
                >
                  <Text style={[styles.tableCell, styles.colRole]}>{range.role}</Text>
                  <Text style={[styles.tableCell, styles.colMetric]}>{formatCurrency(range.min)}</Text>
                  <Text style={[styles.tableCell, styles.colMetric]}>{formatCurrency(range.median)}</Text>
                  <Text style={[styles.tableCell, styles.colMetric]}>{formatCurrency(range.max)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 3. Key Trends */}
        {isSelected("Key Industry Trends") && insights.keyTrends?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Industry Trends</Text>
            <View style={styles.listContainer}>
              {insights.keyTrends.map((trend, i) => (
                <Text key={i} style={styles.listItem}>• {trend}</Text>
              ))}
            </View>
          </View>
        )}

        {/* 4. Recommended Skills */}
        {isSelected("Recommended Skills") && insights.recommendedSkills?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Skills</Text>
            <View style={styles.skillsContainer}>
              {insights.recommendedSkills.map((skill, i) => (
                <View key={i} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text 
          style={styles.footer} 
          render={({ pageNumber, totalPages }) => (
            `AI Career Coach Market Report • Page ${pageNumber} of ${totalPages}`
          )} 
          fixed 
        />
      </Page>
    </Document>
  );
};